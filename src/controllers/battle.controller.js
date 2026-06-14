const logger = require("../utils/logger");
const pool = require("../config/database");
const { updateQuestProgress } = require("../utils/questProgress");

// 傷害計算
function calcDamage(attack, defense, critRate, critDamage) {
  const isCrit = Math.random() * 100 < critRate;
  let dmg = Math.max(1, attack - defense + Math.floor(Math.random() * 5));
  if (isCrit) dmg = Math.floor(dmg * (critDamage / 100));
  return { damage: dmg, isCrit };
}

class BattleController {
  /**
   * 獲取可挑戰的怪物列表
   */
  async getMonsters(req, res) {
    const playerId = req.user.playerId;
    try {
      const realmResult = await pool.query(
        `SELECT pr.current_realm_id FROM player_realms pr WHERE pr.player_id = $1`,
        [playerId],
      );
      const realmId = realmResult.rows[0]?.current_realm_id;

      const result = await pool.query(
        `SELECT m.*, r.realm_name as realm_required_name
                 FROM monsters m
                 LEFT JOIN realms r ON m.realm_required = r.id
                 WHERE m.realm_required IS NULL OR m.realm_required <= $1
                 ORDER BY m.level`,
        [realmId],
      );
      res.json({ monsters: result.rows });
    } catch (error) {
      logger.error("獲取怪物列表錯誤:", error);
      res.status(500).json({ error: "獲取怪物列表失敗" });
    }
  }

  /**
   * 發起戰鬥（自動計算結果）
   */
  async startBattle(req, res) {
    const playerId = req.user.playerId;
    const { monsterId } = req.body;

    if (!monsterId) return res.status(400).json({ error: "請提供怪物 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 獲取玩家屬性
      const playerResult = await client.query(
        `SELECT ps.*, pc.spirit_stones FROM player_stats ps
                 JOIN player_currencies pc ON ps.player_id = pc.player_id
                 WHERE ps.player_id = $1`,
        [playerId],
      );

      if (playerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到玩家資料" });
      }

      const player = playerResult.rows[0];

      if (player.current_hp <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "玩家 HP 為 0，請先回復" });
      }

      // 獲取怪物資料
      const monsterResult = await client.query(
        "SELECT * FROM monsters WHERE id = $1",
        [monsterId],
      );

      if (monsterResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "怪物不存在" });
      }

      const monster = monsterResult.rows[0];

      // 模擬戰鬥
      let playerHp = player.current_hp;
      let monsterHp = Number(monster.max_hp);
      const rounds = [];
      let round = 0;
      const MAX_ROUNDS = 30;

      while (playerHp > 0 && monsterHp > 0 && round < MAX_ROUNDS) {
        round++;
        const roundLog = { round };

        // 玩家攻擊
        const playerAtk = calcDamage(player.attack, monster.defense, player.critical_rate, player.critical_damage);
        monsterHp -= playerAtk.damage;
        roundLog.playerDmg = playerAtk.damage;
        roundLog.playerCrit = playerAtk.isCrit;

        if (monsterHp <= 0) {
          rounds.push(roundLog);
          break;
        }

        // 怪物攻擊
        const monsterAtk = calcDamage(monster.attack, player.defense, monster.critical_rate, 150);
        playerHp -= monsterAtk.damage;
        roundLog.monsterDmg = monsterAtk.damage;
        rounds.push(roundLog);
      }

      const result = playerHp > 0 ? "win" : (round >= MAX_ROUNDS ? "flee" : "lose");
      const totalDmgDealt = rounds.reduce((s, r) => s + (r.playerDmg || 0), 0);
      const totalDmgTaken = rounds.reduce((s, r) => s + (r.monsterDmg || 0), 0);

      // 計算獎勵
      let expGained = 0;
      let stonesGained = 0;
      const itemsDropped = [];

      if (result === "win") {
        expGained = Number(monster.exp_reward);
        stonesGained = monster.spirit_stone_reward;

        // 掉落物品
        const dropResult = await client.query(
          "SELECT * FROM monster_drops WHERE monster_id = $1",
          [monsterId],
        );
        for (const drop of dropResult.rows) {
          if (Math.random() * 100 < drop.drop_rate) {
            const qty = drop.min_quantity + Math.floor(Math.random() * (drop.max_quantity - drop.min_quantity + 1));
            itemsDropped.push({ item_id: drop.item_id, quantity: qty });

            // 加入背包
            await client.query(
              `INSERT INTO player_inventory (player_id, item_id, quantity)
                             VALUES ($1, $2, $3)
                             ON CONFLICT (player_id, item_id)
                             DO UPDATE SET quantity = player_inventory.quantity + EXCLUDED.quantity`,
              [playerId, drop.item_id, qty],
            );
          }
        }

        // 增加境界經驗
        await client.query(
          `UPDATE player_realms SET current_exp = current_exp + $1, updated_at = NOW() WHERE player_id = $2`,
          [expGained, playerId],
        );

        // 增加靈石
        if (stonesGained > 0) {
          await client.query(
            `UPDATE player_currencies SET spirit_stones = spirit_stones + $1, updated_at = NOW() WHERE player_id = $2`,
            [stonesGained, playerId],
          );
        }

        // boss 怪物額外給予榮譽點數（10 + level/2）
        if (monster.monster_type === "boss") {
          const honorGained = Math.floor(10 + monster.level / 2);
          await client.query(
            `UPDATE player_currencies SET honor_points = honor_points + $1, updated_at = NOW() WHERE player_id = $2`,
            [honorGained, playerId],
          );
        }

        // 更新戰鬥統計
        await client.query(
          `UPDATE player_stats SET total_battles = total_battles + 1, battles_won = battles_won + 1,
                     monsters_killed = monsters_killed + 1, updated_at = NOW() WHERE player_id = $1`,
          [playerId],
        );

        // ── 自動更新任務進度 ──
        // kill 類型：擊殺此怪物
        await updateQuestProgress(client, playerId, "kill", monsterId, 1);
        // collect 類型：掉落的物品
        for (const drop of itemsDropped) {
          await updateQuestProgress(client, playerId, "collect", drop.item_id, drop.quantity);
        }
      } else {
        await client.query(
          `UPDATE player_stats SET total_battles = total_battles + 1, updated_at = NOW() WHERE player_id = $1`,
          [playerId],
        );
      }

      // 更新玩家 HP（不低於1，避免直接死亡）
      const newHp = Math.max(1, playerHp);
      await client.query(
        `UPDATE player_stats SET current_hp = $1, updated_at = NOW() WHERE player_id = $2`,
        [newHp, playerId],
      );

      // 記錄戰鬥
      await client.query(
        `INSERT INTO battle_logs
                 (player_id, monster_id, monster_name, result, rounds, player_hp_remaining,
                  damage_dealt, damage_taken, exp_gained, spirit_stones_gained, items_dropped, battle_detail)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          playerId, monsterId, monster.monster_name, result, round, newHp,
          totalDmgDealt, totalDmgTaken, expGained, stonesGained,
          JSON.stringify(itemsDropped), JSON.stringify(rounds.slice(0, 20)),
        ],
      );

      await client.query("COMMIT");

      res.json({
        result,
        rounds: round,
        playerHpRemaining: newHp,
        expGained,
        spiritStonesGained: stonesGained,
        itemsDropped,
        battleDetail: rounds.slice(0, 10),
        message: result === "win" ? "戰鬥勝利！" : result === "lose" ? "戰鬥失敗..." : "戰鬥超時，逃跑成功",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("戰鬥錯誤:", error);
      res.status(500).json({ error: "戰鬥處理失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 獲取戰鬥記錄
   */
  async getBattleLogs(req, res) {
    const playerId = req.user.playerId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    try {
      const result = await pool.query(
        `SELECT id, monster_name, result, rounds, player_hp_remaining,
                    exp_gained, spirit_stones_gained, items_dropped, fought_at
                 FROM battle_logs WHERE player_id = $1
                 ORDER BY fought_at DESC LIMIT $2`,
        [playerId, limit],
      );
      res.json({ logs: result.rows });
    } catch (error) {
      logger.error("獲取戰鬥記錄錯誤:", error);
      res.status(500).json({ error: "獲取戰鬥記錄失敗" });
    }
  }

  /**
   * 回復 HP（使用靈石）
   */
  async restoreHp(req, res) {
    const playerId = req.user.playerId;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const statsResult = await client.query(
        "SELECT current_hp, max_hp FROM player_stats WHERE player_id = $1",
        [playerId],
      );
      const stats = statsResult.rows[0];
      const hpMissing = stats.max_hp - stats.current_hp;

      if (hpMissing <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "HP 已滿" });
      }

      // 費用：每點 HP 消耗 1 靈石
      const cost = hpMissing;
      const currResult = await client.query(
        "SELECT spirit_stones FROM player_currencies WHERE player_id = $1",
        [playerId],
      );

      if (Number(currResult.rows[0].spirit_stones) < cost) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "靈石不足", required: cost });
      }

      await client.query(
        `UPDATE player_stats SET current_hp = max_hp, updated_at = NOW() WHERE player_id = $1`,
        [playerId],
      );
      await client.query(
        `UPDATE player_currencies SET spirit_stones = spirit_stones - $1, updated_at = NOW() WHERE player_id = $2`,
        [cost, playerId],
      );

      await client.query("COMMIT");
      res.json({ message: "HP 回復完成", spiritStonesUsed: cost });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("回復 HP 錯誤:", error);
      res.status(500).json({ error: "回復 HP 失敗" });
    } finally {
      client.release();
    }
  }
  /**
   * 提交動作戰鬥結果（不跑後端模擬，直接記錄）
   */
  async submitActionResult(req, res) {
    const playerId = req.user.playerId;
    const { monsterId, kills, expGained, stonesGained, finalHp, finalMp, isWin } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 驗證怪物存在
      const monsterResult = await client.query("SELECT * FROM monsters WHERE id = $1", [monsterId]);
      if (monsterResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "怪物不存在" });
      }
      const monster = monsterResult.rows[0];

      // 取得玩家目前 max_hp / max_mp
      const statsResult = await client.query(
        "SELECT max_hp, max_mp FROM player_stats WHERE player_id = $1", [playerId]
      );
      const { max_hp, max_mp } = statsResult.rows[0];
      const safeHp = Math.max(1, Math.min(Number(finalHp) || 1, max_hp));
      const safeMp = Math.max(0, Math.min(Number(finalMp) || 0, max_mp));

      // 同步 HP / MP
      await client.query(
        "UPDATE player_stats SET current_hp = $1, current_mp = $2, updated_at = NOW() WHERE player_id = $3",
        [safeHp, safeMp, playerId]
      );

      const result = isWin ? "win" : "lose";
      const totalExp = Number(expGained) || 0;
      const totalStones = Number(stonesGained) || 0;

      if (isWin && totalExp > 0) {
        // 增加境界經驗
        await client.query(
          "UPDATE player_realms SET current_exp = current_exp + $1, updated_at = NOW() WHERE player_id = $2",
          [totalExp, playerId]
        );
      }
      if (isWin && totalStones > 0) {
        // 增加靈石
        await client.query(
          "UPDATE player_currencies SET spirit_stones = spirit_stones + $1, updated_at = NOW() WHERE player_id = $2",
          [totalStones, playerId]
        );
      }

      // 更新戰鬥統計
      if (isWin) {
        await client.query(
          `UPDATE player_stats SET total_battles = total_battles + 1, battles_won = battles_won + 1,
           monsters_killed = monsters_killed + $1, updated_at = NOW() WHERE player_id = $2`,
          [Number(kills) || 1, playerId]
        );
        // ── 自動更新任務進度：kill 類型 ──
        await updateQuestProgress(client, playerId, "kill", monsterId, Number(kills) || 1);
      } else {
        await client.query(
          "UPDATE player_stats SET total_battles = total_battles + 1, updated_at = NOW() WHERE player_id = $1",
          [playerId]
        );
      }

      // 記錄戰鬥 log
      await client.query(
        `INSERT INTO battle_logs
         (player_id, monster_id, monster_name, result, rounds, player_hp_remaining,
          damage_dealt, damage_taken, exp_gained, spirit_stones_gained, items_dropped, battle_detail)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [playerId, monsterId, monster.monster_name, result,
         Number(kills) || 1, safeHp, 0, 0,
         totalExp, totalStones, JSON.stringify([]), JSON.stringify([])]
      );

      await client.query("COMMIT");
      res.json({ result, expGained: totalExp, spiritStonesGained: totalStones, finalHp: safeHp, finalMp: safeMp });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("提交動作戰結果錯誤:", error);
      res.status(500).json({ error: "提交動作戰結果失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 同步動作戰鬥後的 HP/MP（不扣靈石）
   */
  async syncHp(req, res) {
    const playerId = req.user.playerId;
    const { currentHp, currentMp } = req.body;
    try {
      const statsResult = await pool.query(
        "SELECT max_hp, max_mp FROM player_stats WHERE player_id = $1",
        [playerId],
      );
      const { max_hp, max_mp } = statsResult.rows[0];
      const safeHp = Math.max(0, Math.min(Number(currentHp) || 0, max_hp));
      const safeMp = Math.max(0, Math.min(Number(currentMp) || 0, max_mp));
      await pool.query(
        "UPDATE player_stats SET current_hp = $1, current_mp = $2, updated_at = NOW() WHERE player_id = $3",
        [safeHp, safeMp, playerId],
      );
      res.json({ currentHp: safeHp, currentMp: safeMp });
    } catch (error) {
      logger.error("同步 HP 錯誤:", error);
      res.status(500).json({ error: "同步 HP 失敗" });
    }
  }
}

module.exports = new BattleController();
// 匯出純函式供單元測試使用（不影響單例控制器介面）
module.exports.calcDamage = calcDamage;
