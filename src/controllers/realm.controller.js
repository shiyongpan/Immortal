const logger = require("../utils/logger");
const pool = require("../config/database");
const { updateQuestProgress } = require("../utils/questProgress");

// 各境界每分鐘自動修練獲得的修為（從築基境開始）
// 各境界突破輔助丹藥（與 realm_order 對應）
const BREAKTHROUGH_PILL_BY_REALM = {
  1: 43, // 煉氣境 → 聚靈丹
  2: 44, // 築基境 → 築基丹
  3: 45, // 金丹境 → 結金丹
  4: 46, // 元嬰境 → 破嬰丹
  5: 47, // 化神境 → 化神丹
};

const CULTIVATION_RATE_PER_MIN = {
  2: 50,    // 築基境
  3: 500,   // 金丹境
  4: 5000,  // 元嬰境
  5: 50000, // 化神境
};

class RealmController {
  /**
   * 獲取所有境界資料（含階段）
   */
  async getAllRealms(req, res) {
    try {
      const result = await pool.query(
        `SELECT r.*,
                    json_agg(
                        json_build_object(
                            'id', rs.id,
                            'stage_name', rs.stage_name,
                            'stage_name_en', rs.stage_name_en,
                            'stage_order', rs.stage_order,
                            'is_extreme', rs.is_extreme,
                            'exp_required', rs.exp_required,
                            'stat_multiplier', rs.stat_multiplier,
                            'stat_bonus', rs.stat_bonus
                        ) ORDER BY rs.stage_order
                    ) as stages
                 FROM realms r
                 LEFT JOIN realm_stages rs ON r.id = rs.realm_id
                 GROUP BY r.id
                 ORDER BY r.realm_order`,
      );
      res.json({ realms: result.rows });
    } catch (error) {
      logger.error("獲取境界資料錯誤:", error);
      res.status(500).json({ error: "獲取境界資料失敗" });
    }
  }

  /**
   * 獲取玩家當前境界
   */
  async getPlayerRealm(req, res) {
    const playerId = req.user.playerId;
    try {
      const result = await pool.query(
        `SELECT pr.*, r.realm_name, r.realm_name_en, r.realm_order,
                    rs.stage_name, rs.stage_name_en, rs.stage_order, rs.is_extreme,
                    rs.exp_required, rs.stat_multiplier, rs.stat_bonus
                 FROM player_realms pr
                 JOIN realms r ON pr.current_realm_id = r.id
                 JOIN realm_stages rs ON pr.current_stage_id = rs.id
                 WHERE pr.player_id = $1`,
        [playerId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "找不到玩家境界資料" });
      }
      res.json({ realm: result.rows[0] });
    } catch (error) {
      logger.error("獲取玩家境界錯誤:", error);
      res.status(500).json({ error: "獲取玩家境界失敗" });
    }
  }

  /**
   * 增加境界經驗
   */
  async addExp(req, res) {
    const playerId = req.user.playerId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "經驗值必須大於 0" });
    }

    try {
      const result = await pool.query(
        `SELECT pr.current_exp, rs.exp_required
                 FROM player_realms pr
                 JOIN realm_stages rs ON pr.current_stage_id = rs.id
                 WHERE pr.player_id = $1`,
        [playerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "找不到玩家境界資料" });
      }

      const current = result.rows[0];
      const newExp = BigInt(current.current_exp) + BigInt(amount);

      await pool.query(
        `UPDATE player_realms SET current_exp = $1, updated_at = NOW() WHERE player_id = $2`,
        [newExp.toString(), playerId],
      );

      const canBreakthrough = newExp >= BigInt(current.exp_required);

      res.json({
        currentExp: newExp.toString(),
        requiredExp: current.exp_required.toString(),
        canBreakthrough,
      });
    } catch (error) {
      logger.error("增加境界經驗錯誤:", error);
      res.status(500).json({ error: "增加境界經驗失敗" });
    }
  }

  /**
   * 嘗試境界突破
   * 巔峰時：skipExtreme=false → 進入極境（需天材地寶），skipExtreme=true → 直跳下個大境界
   * 極境時：正常突破到下個境界（50% / 80% 丹藥）
   */
  async breakthrough(req, res) {
    const playerId = req.user.playerId;
    const { useItem = false, skipExtreme = false, useExtremeStone = false } = req.body;

    // 天材地寶 item_id = 71；每境界極境需要 realm_order 個
    const TIANDI_ITEM_ID = 71;
    // 極境靈石 item_id = 72；用於提升極境突破率 +25%
    const EXTREME_STONE_ID = 72;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. 獲取玩家當前境界
      const playerRealmResult = await client.query(
        `SELECT pr.*, rs.stage_order, rs.is_extreme, rs.exp_required, r.realm_order
                 FROM player_realms pr
                 JOIN realm_stages rs ON pr.current_stage_id = rs.id
                 JOIN realms r ON pr.current_realm_id = r.id
                 WHERE pr.player_id = $1`,
        [playerId],
      );

      if (playerRealmResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到玩家境界資料" });
      }

      const playerRealm = playerRealmResult.rows[0];

      // 2. 檢查經驗值是否足夠
      if (BigInt(playerRealm.current_exp) < BigInt(playerRealm.exp_required)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "境界經驗不足，無法突破",
          required: playerRealm.exp_required.toString(),
          current: playerRealm.current_exp.toString(),
        });
      }

      // 是否處於巔峰（stage_order=4）且非極境
      const isAtPeak = playerRealm.stage_order === 4 && !playerRealm.is_extreme;

      // 3. 若在巔峰且選擇進入極境 → 需消耗天材地寶
      if (isAtPeak && !skipExtreme) {
        const requiredCount = playerRealm.realm_order; // 境界 1=1個, 2=2個, ...
        const invResult = await client.query(
          `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
          [playerId, TIANDI_ITEM_ID],
        );
        const owned = invResult.rows.length > 0 ? invResult.rows[0].quantity : 0;
        if (owned < requiredCount) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `進入極境需要 ${requiredCount} 個天材地寶，目前持有 ${owned} 個`,
            requiredItem: "天材地寶",
            requiredCount,
            ownedCount: owned,
          });
        }
        // 消耗天材地寶
        if (owned === requiredCount) {
          await client.query(
            `DELETE FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
            [playerId, TIANDI_ITEM_ID],
          );
        } else {
          await client.query(
            `UPDATE player_inventory SET quantity = quantity - $1 WHERE player_id = $2 AND item_id = $3`,
            [requiredCount, playerId, TIANDI_ITEM_ID],
          );
        }
      }

      // 4. 計算突破成功率
      let successRate = 100;
      if (playerRealm.is_extreme) {
        // 極境 → 下個大境界：50%，丹藥 +30%，極境靈石 +25%，兩者疊加
        successRate = 50;
        if (useItem) {
          // 消耗對應境界的突破丹藥
          const pillItemId = BREAKTHROUGH_PILL_BY_REALM[playerRealm.realm_order];
          if (pillItemId) {
            const pillInv = await client.query(
              `SELECT id, quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
              [playerId, pillItemId],
            );
            if (pillInv.rows.length > 0 && pillInv.rows[0].quantity > 0) {
              successRate += 30;
              if (pillInv.rows[0].quantity === 1) {
                await client.query(`DELETE FROM player_inventory WHERE id = $1`, [pillInv.rows[0].id]);
              } else {
                await client.query(`UPDATE player_inventory SET quantity = quantity - 1 WHERE id = $1`, [pillInv.rows[0].id]);
              }
            } else {
              await client.query("ROLLBACK");
              return res.status(400).json({ error: "沒有可用的突破丹藥" });
            }
          }
        }
        if (useExtremeStone) {
          // 檢查並消耗極境靈石
          const stoneInv = await client.query(
            `SELECT id, quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
            [playerId, EXTREME_STONE_ID],
          );
          if (stoneInv.rows.length > 0 && stoneInv.rows[0].quantity > 0) {
            successRate += 25;
            if (stoneInv.rows[0].quantity === 1) {
              await client.query(`DELETE FROM player_inventory WHERE id = $1`, [stoneInv.rows[0].id]);
            } else {
              await client.query(`UPDATE player_inventory SET quantity = quantity - 1 WHERE id = $1`, [stoneInv.rows[0].id]);
            }
          }
        }
        successRate = Math.min(successRate, 95); // 上限 95%
      }
      // 巔峰進入極境：100%（消耗天材地寶後保證）
      // 巔峰跳過極境直入大境界：100%（但損失極境加成）

      const success = Math.random() * 100 < successRate;

      // 5. 獲取下一個階段
      let nextStageId = null;
      let nextRealmId = playerRealm.current_realm_id;

      if (success) {
        if (isAtPeak && skipExtreme) {
          // 跳過極境，直接進入下個大境界初期
          const nextRealmResult = await client.query(
            `SELECT id FROM realms WHERE realm_order = $1 LIMIT 1`,
            [playerRealm.realm_order + 1],
          );
          if (nextRealmResult.rows.length > 0) {
            nextRealmId = nextRealmResult.rows[0].id;
            const firstStageResult = await client.query(
              `SELECT id FROM realm_stages WHERE realm_id = $1 AND stage_order = 1 LIMIT 1`,
              [nextRealmId],
            );
            if (firstStageResult.rows.length > 0) {
              nextStageId = firstStageResult.rows[0].id;
            }
          } else {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "已達最高境界" });
          }
        } else {
          // 正常突破：進入下一階段
          const nextStageResult = await client.query(
            `SELECT id FROM realm_stages
                     WHERE realm_id = $1 AND stage_order = $2 LIMIT 1`,
            [playerRealm.current_realm_id, playerRealm.stage_order + 1],
          );

          if (nextStageResult.rows.length > 0) {
            nextStageId = nextStageResult.rows[0].id;
          } else {
            // 極境已滿 → 進入下一境界初期
            const nextRealmResult = await client.query(
              `SELECT id FROM realms WHERE realm_order = $1 LIMIT 1`,
              [playerRealm.realm_order + 1],
            );
            if (nextRealmResult.rows.length > 0) {
              nextRealmId = nextRealmResult.rows[0].id;
              const firstStageResult = await client.query(
                `SELECT id FROM realm_stages WHERE realm_id = $1 AND stage_order = 1 LIMIT 1`,
                [nextRealmId],
              );
              if (firstStageResult.rows.length > 0) {
                nextStageId = firstStageResult.rows[0].id;
              }
            } else {
              await client.query("ROLLBACK");
              return res.status(400).json({ error: "已達最高境界" });
            }
          }
        }
      }

      // 5. 記錄突破歷史
      await client.query(
        `INSERT INTO player_realm_history
                 (player_id, from_stage_id, to_stage_id, success, is_extreme)
                 VALUES ($1, $2, $3, $4, $5)`,
        [
          playerId,
          playerRealm.current_stage_id,
          nextStageId,
          success,
          playerRealm.is_extreme,
        ],
      );

      // 6. 更新玩家境界
      if (success && nextStageId) {
        await client.query(
          `UPDATE player_realms
                     SET current_realm_id = $1,
                         current_stage_id = $2,
                         current_exp = GREATEST(0, current_exp - $4),
                         breakthrough_attempts = 0,
                         total_breakthroughs = total_breakthroughs + 1,
                         last_breakthrough_at = NOW(),
                         updated_at = NOW()
                     WHERE player_id = $3`,
          [nextRealmId, nextStageId, playerId, playerRealm.exp_required],
        );

        // 根據新階段更新屬性（境界突破數值成長）
        // stage_order=1 且 realm 不同 = 大境界突破（大幅），is_extreme=true = 極境突破（中幅），其餘小幅
        const newStage = await client.query(
          `SELECT rs.stat_bonus, rs.stage_order, rs.is_extreme, r.realm_order
           FROM realm_stages rs JOIN realms r ON rs.realm_id = r.id
           WHERE rs.id = $1`,
          [nextStageId],
        );
        if (newStage.rows.length > 0) {
          const ns = newStage.rows[0];
          const rawBonus = ns.stat_bonus || {};
          const isMajorRealm = ns.stage_order === 1 && nextRealmId !== playerRealm.current_realm_id;

          // 倍率：大境界突破=1.0（已在DB設定好大幅數值），極境突破=1.0（中幅），普通=1.0
          // 實際上 DB 裡的 stat_bonus 已按 小/中/大 設計好，直接套用
          const bonus = rawBonus;
          const updates = [];
          const values = [playerId];
          let idx = 2;
          if (bonus.max_hp)       { updates.push(`max_hp = max_hp + $${idx++}`);             values.push(bonus.max_hp); }
          if (bonus.max_mp)       { updates.push(`max_mp = max_mp + $${idx++}`);             values.push(bonus.max_mp); }
          if (bonus.attack)       { updates.push(`attack = attack + $${idx++}`);             values.push(bonus.attack); }
          if (bonus.defense)      { updates.push(`defense = defense + $${idx++}`);           values.push(bonus.defense); }
          if (bonus.speed)        { updates.push(`speed = speed + $${idx++}`);               values.push(bonus.speed); }
          if (bonus.critical_rate){ updates.push(`critical_rate = critical_rate + $${idx++}`); values.push(bonus.critical_rate); }
          if (updates.length > 0) {
            await client.query(
              `UPDATE player_stats SET ${updates.join(", ")}, updated_at = NOW() WHERE player_id = $1`,
              values,
            );
          }

          // 大境界突破時，額外記錄突破類型到 response（後面附在 res.json）
          if (isMajorRealm) {
            logger.info(`玩家 ${playerId} 大境界突破！進入 realm_order=${ns.realm_order}`);
          }
        }
        // 突破成功：HP / MP 回滿（包含新階段加成後的上限）
        await client.query(
          `UPDATE player_stats SET current_hp = max_hp, current_mp = max_mp, updated_at = NOW() WHERE player_id = $1`,
          [playerId],
        );

        // ── 自動更新任務進度：reach_realm 類型 ──
        await updateQuestProgress(client, playerId, "reach_realm", nextRealmId, 1);
      } else if (!success) {
        // 突破失敗
        const expLoss = Math.floor(Number(playerRealm.exp_required) * 0.3);
        await client.query(
          `UPDATE player_realms
                     SET current_exp = GREATEST(0, current_exp - $1),
                         breakthrough_attempts = breakthrough_attempts + 1,
                         failed_breakthroughs = failed_breakthroughs + 1,
                         updated_at = NOW()
                     WHERE player_id = $2`,
          [expLoss, playerId],
        );
      }

      // 判斷突破類型（根據目標階段，用於前端顯示不同特效）
      let breakthroughType = null;
      if (success && nextStageId) {
        const isMajorRealm = nextRealmId !== playerRealm.current_realm_id;
        // 取目標 stage 的 is_extreme 屬性（在 COMMIT 前查詢）
        const targetStageInfo = await client.query(
          `SELECT is_extreme FROM realm_stages WHERE id = $1`,
          [nextStageId],
        );
        const targetIsExtreme = targetStageInfo.rows[0]?.is_extreme || false;

        if (isMajorRealm) breakthroughType = "major";          // 跨大境界，大幅成長
        else if (targetIsExtreme) breakthroughType = "extreme"; // 進入極境，中幅成長
        else breakthroughType = "normal";                       // 普通階段，小幅成長
      }

      await client.query("COMMIT");

      res.json({
        success,
        message: success ? "突破成功！境界晉升！" : "突破失敗，損失部分修為...",
        successRate,
        newStageId: success ? nextStageId : null,
        breakthroughType,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("境界突破錯誤:", error);
      res.status(500).json({ error: "突破處理失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 自動修練：計算離線修為並寫入（築基境以上）
   */
  async cultivate(req, res) {
    const playerId = req.user.playerId;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `SELECT pr.current_exp, pr.current_realm_id, pr.last_cultivated_at,
                rs.exp_required, r.realm_order
         FROM player_realms pr
         JOIN realms r ON pr.current_realm_id = r.id
         JOIN realm_stages rs ON pr.current_stage_id = rs.id
         WHERE pr.player_id = $1`,
        [playerId],
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到玩家境界資料" });
      }

      const row = result.rows[0];
      const realmOrder = row.realm_order;
      const ratePerMin = CULTIVATION_RATE_PER_MIN[realmOrder] || 0;

      if (ratePerMin === 0) {
        await client.query("ROLLBACK");
        return res.json({ gained: 0, message: "修練功法尚未覺醒，需達築基境方可自動修練" });
      }

      const now = new Date();
      const lastAt = new Date(row.last_cultivated_at || now);
      const elapsedMs = Math.max(0, now - lastAt);
      const elapsedMin = elapsedMs / 60000;

      // 上限：最多累積 4 小時修為，防止長時間離線暴漲
      const capMin = 240;
      const effectiveMin = Math.min(elapsedMin, capMin);
      const gained = Math.floor(effectiveMin * ratePerMin);

      if (gained <= 0) {
        await client.query("ROLLBACK");
        return res.json({ gained: 0, currentExp: row.current_exp.toString() });
      }

      const newExp = BigInt(row.current_exp) + BigInt(gained);

      await client.query(
        `UPDATE player_realms SET current_exp = $1, last_cultivated_at = $2, updated_at = NOW()
         WHERE player_id = $3`,
        [newExp.toString(), now.toISOString(), playerId],
      );

      await client.query("COMMIT");
      res.json({
        gained,
        currentExp: newExp.toString(),
        requiredExp: row.exp_required.toString(),
        ratePerMin,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("自動修練錯誤:", error);
      res.status(500).json({ error: "修練失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 獲取突破歷史
   */
  async getBreakthroughHistory(req, res) {
    const playerId = req.user.playerId;
    try {
      const result = await pool.query(
        `SELECT h.*,
                    fs.stage_name as from_stage_name,
                    ts.stage_name as to_stage_name
                 FROM player_realm_history h
                 LEFT JOIN realm_stages fs ON h.from_stage_id = fs.id
                 LEFT JOIN realm_stages ts ON h.to_stage_id = ts.id
                 WHERE h.player_id = $1
                 ORDER BY h.breakthrough_time DESC
                 LIMIT 50`,
        [playerId],
      );
      res.json({ history: result.rows });
    } catch (error) {
      logger.error("獲取突破歷史錯誤:", error);
      res.status(500).json({ error: "獲取突破歷史失敗" });
    }
  }

  /**
   * 獲取突破需求
   */
  async getBreakthroughRequirements(req, res) {
    const playerId = req.user.playerId;
    try {
      const realmResult = await pool.query(
        `SELECT pr.current_realm_id, rs.is_extreme, rs.stage_order
                 FROM player_realms pr
                 JOIN realm_stages rs ON pr.current_stage_id = rs.id
                 WHERE pr.player_id = $1`,
        [playerId],
      );

      if (realmResult.rows.length === 0) {
        return res.status(404).json({ error: "找不到玩家境界資料" });
      }

      const { current_realm_id, is_extreme, stage_order } = realmResult.rows[0];
      const breakthroughType = stage_order === 4
        ? "peak_to_extreme"
        : stage_order === 5
        ? "peak_to_next_realm"
        : null;

      if (!breakthroughType) {
        return res.json({ requirements: [], message: "當前階段無特殊突破需求" });
      }

      const reqResult = await pool.query(
        `SELECT * FROM breakthrough_requirements
                 WHERE realm_id = $1 AND breakthrough_type = $2`,
        [current_realm_id, breakthroughType],
      );

      res.json({ requirements: reqResult.rows });
    } catch (error) {
      logger.error("獲取突破需求錯誤:", error);
      res.status(500).json({ error: "獲取突破需求失敗" });
    }
  }
}

module.exports = new RealmController();
