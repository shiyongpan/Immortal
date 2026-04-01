const logger = require("../utils/logger");
const pool = require("../config/database");

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
   */
  async breakthrough(req, res) {
    const playerId = req.user.playerId;
    const { useItem = false } = req.body;

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

      // 3. 計算突破成功率
      let successRate = 100;
      if (playerRealm.is_extreme) {
        successRate = useItem ? 80 : 50;
      }

      const success = Math.random() * 100 < successRate;

      // 4. 獲取下一個階段
      let nextStageId = null;
      let nextRealmId = playerRealm.current_realm_id;

      if (success) {
        // 嘗試同境界下一階段
        const nextStageResult = await client.query(
          `SELECT id FROM realm_stages
                     WHERE realm_id = $1 AND stage_order = $2 LIMIT 1`,
          [playerRealm.current_realm_id, playerRealm.stage_order + 1],
        );

        if (nextStageResult.rows.length > 0) {
          nextStageId = nextStageResult.rows[0].id;
        } else {
          // 當前境界已滿，進入下一境界初期
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
                         current_exp = 0,
                         breakthrough_attempts = 0,
                         total_breakthroughs = total_breakthroughs + 1,
                         last_breakthrough_at = NOW(),
                         updated_at = NOW()
                     WHERE player_id = $3`,
          [nextRealmId, nextStageId, playerId],
        );

        // 根據新階段更新屬性
        const newStage = await client.query(
          `SELECT stat_bonus FROM realm_stages WHERE id = $1`,
          [nextStageId],
        );
        if (newStage.rows.length > 0) {
          const bonus = newStage.rows[0].stat_bonus || {};
          const updates = [];
          const values = [playerId];
          let idx = 2;
          if (bonus.max_hp) { updates.push(`max_hp = max_hp + $${idx++}`); values.push(bonus.max_hp); }
          if (bonus.max_mp) { updates.push(`max_mp = max_mp + $${idx++}`); values.push(bonus.max_mp); }
          if (bonus.attack) { updates.push(`attack = attack + $${idx++}`); values.push(bonus.attack); }
          if (bonus.defense) { updates.push(`defense = defense + $${idx++}`); values.push(bonus.defense); }
          if (bonus.speed) { updates.push(`speed = speed + $${idx++}`); values.push(bonus.speed); }
          if (updates.length > 0) {
            await client.query(
              `UPDATE player_stats SET ${updates.join(", ")}, updated_at = NOW() WHERE player_id = $1`,
              values,
            );
          }
        }
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

      await client.query("COMMIT");

      res.json({
        success,
        message: success ? "突破成功！境界晉升！" : "突破失敗，損失部分修為...",
        successRate,
        newStageId: success ? nextStageId : null,
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
