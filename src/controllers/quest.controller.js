const pool = require("../config/database");

class QuestController {
  /**
   * 獲取可接取的任務
   */
  async getAvailableQuests(req, res) {
    const playerId = req.user.playerId;
    try {
      const playerResult = await pool.query(
        `SELECT ps.level, pr.current_realm_id FROM player_stats ps
                 JOIN player_realms pr ON ps.player_id = pr.player_id
                 WHERE ps.player_id = $1`,
        [playerId],
      );

      if (playerResult.rows.length === 0) {
        return res.status(404).json({ error: "找不到玩家資料" });
      }

      const { level, current_realm_id } = playerResult.rows[0];

      const result = await pool.query(
        `SELECT q.*,
                    r.realm_name as realm_required_name,
                    pq.status as player_status,
                    pq.current_step,
                    COALESCE(
                        json_agg(qr ORDER BY qr.id) FILTER (WHERE qr.id IS NOT NULL), '[]'
                    ) as rewards
                 FROM quests q
                 LEFT JOIN realms r ON q.realm_required = r.id
                 LEFT JOIN player_quests pq ON q.id = pq.quest_id AND pq.player_id = $1
                 LEFT JOIN quest_rewards qr ON q.id = qr.quest_id
                 WHERE q.is_active = true
                   AND q.level_required <= $2
                   AND (q.realm_required IS NULL OR q.realm_required <= $3)
                   AND (pq.status IS NULL OR (q.is_repeatable = true AND pq.status = 'completed'))
                 GROUP BY q.id, r.realm_name, pq.status, pq.current_step
                 ORDER BY q.quest_type, q.level_required`,
        [playerId, level, current_realm_id],
      );

      res.json({ quests: result.rows });
    } catch (error) {
      console.error("獲取可用任務錯誤:", error);
      res.status(500).json({ error: "獲取可用任務失敗" });
    }
  }

  /**
   * 獲取玩家進行中的任務
   */
  async getPlayerQuests(req, res) {
    const playerId = req.user.playerId;
    const { status = "in_progress" } = req.query;

    try {
      const result = await pool.query(
        `SELECT pq.*, q.quest_name, q.description, q.quest_type,
                    json_agg(DISTINCT qs ORDER BY qs.step_order) FILTER (WHERE qs.id IS NOT NULL) as steps,
                    json_agg(DISTINCT qr ORDER BY qr.id) FILTER (WHERE qr.id IS NOT NULL) as rewards
                 FROM player_quests pq
                 JOIN quests q ON pq.quest_id = q.id
                 LEFT JOIN quest_steps qs ON q.id = qs.quest_id
                 LEFT JOIN quest_rewards qr ON q.id = qr.quest_id
                 WHERE pq.player_id = $1 AND pq.status = $2
                 GROUP BY pq.id, q.quest_name, q.description, q.quest_type
                 ORDER BY pq.started_at DESC`,
        [playerId, status],
      );
      res.json({ quests: result.rows });
    } catch (error) {
      console.error("獲取玩家任務錯誤:", error);
      res.status(500).json({ error: "獲取玩家任務失敗" });
    }
  }

  /**
   * 接取任務
   */
  async acceptQuest(req, res) {
    const playerId = req.user.playerId;
    const { questId } = req.body;

    if (!questId) return res.status(400).json({ error: "請提供任務 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const questResult = await client.query(
        "SELECT * FROM quests WHERE id = $1 AND is_active = true",
        [questId],
      );
      if (questResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "任務不存在" });
      }

      const quest = questResult.rows[0];

      // 檢查是否已接取
      const existResult = await client.query(
        "SELECT status FROM player_quests WHERE player_id = $1 AND quest_id = $2",
        [playerId, questId],
      );
      if (existResult.rows.length > 0) {
        const existStatus = existResult.rows[0].status;
        if (existStatus === "in_progress") {
          await client.query("ROLLBACK");
          return res.status(409).json({ error: "任務已在進行中" });
        }
        if (existStatus === "completed" && !quest.is_repeatable) {
          await client.query("ROLLBACK");
          return res.status(409).json({ error: "任務已完成且不可重複" });
        }
        // 重置進度（重複任務）
        await client.query(
          `UPDATE player_quests SET status = 'in_progress', step_progress = '{}',
                     current_step = 1, started_at = NOW(), completed_at = NULL
                     WHERE player_id = $1 AND quest_id = $2`,
          [playerId, questId],
        );
      } else {
        // 計算過期時間
        const expiresAt = quest.time_limit_hours > 0
          ? new Date(Date.now() + quest.time_limit_hours * 3600000)
          : null;

        await client.query(
          `INSERT INTO player_quests (player_id, quest_id, expires_at) VALUES ($1, $2, $3)`,
          [playerId, questId, expiresAt],
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ message: "任務接取成功", questName: quest.quest_name });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("接取任務錯誤:", error);
      res.status(500).json({ error: "接取任務失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 更新任務進度
   */
  async updateProgress(req, res) {
    const playerId = req.user.playerId;
    const { questId, stepOrder, incrementBy = 1 } = req.body;

    if (!questId || !stepOrder) {
      return res.status(400).json({ error: "請提供任務 ID 和步驟序號" });
    }

    try {
      const pqResult = await pool.query(
        "SELECT * FROM player_quests WHERE player_id = $1 AND quest_id = $2 AND status = 'in_progress'",
        [playerId, questId],
      );
      if (pqResult.rows.length === 0) {
        return res.status(404).json({ error: "找不到進行中的任務" });
      }

      const pq = pqResult.rows[0];
      const progress = pq.step_progress || {};
      const key = `step_${stepOrder}`;
      progress[key] = (progress[key] || 0) + incrementBy;

      // 檢查步驟需求
      const stepResult = await pool.query(
        "SELECT * FROM quest_steps WHERE quest_id = $1 AND step_order = $2",
        [questId, stepOrder],
      );
      const step = stepResult.rows[0];
      const stepDone = step && progress[key] >= step.required_count;

      await pool.query(
        `UPDATE player_quests SET step_progress = $1, updated_at = NOW() WHERE player_id = $2 AND quest_id = $3`,
        [JSON.stringify(progress), playerId, questId],
      );

      res.json({
        message: "進度更新成功",
        stepProgress: progress,
        stepCompleted: stepDone,
      });
    } catch (error) {
      console.error("更新任務進度錯誤:", error);
      res.status(500).json({ error: "更新任務進度失敗" });
    }
  }

  /**
   * 完成任務並領取獎勵
   */
  async completeQuest(req, res) {
    const playerId = req.user.playerId;
    const { questId } = req.body;

    if (!questId) return res.status(400).json({ error: "請提供任務 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 獲取任務進度
      const pqResult = await client.query(
        "SELECT * FROM player_quests WHERE player_id = $1 AND quest_id = $2 AND status = 'in_progress'",
        [playerId, questId],
      );
      if (pqResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到進行中的任務" });
      }

      const pq = pqResult.rows[0];

      // 驗證所有步驟完成
      const stepsResult = await client.query(
        "SELECT * FROM quest_steps WHERE quest_id = $1 ORDER BY step_order",
        [questId],
      );

      const progress = pq.step_progress || {};
      for (const step of stepsResult.rows) {
        const key = `step_${step.step_order}`;
        if ((progress[key] || 0) < step.required_count) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `步驟 ${step.step_order} 未完成：${step.description}`,
            required: step.required_count,
            current: progress[key] || 0,
          });
        }
      }

      // 發放獎勵
      const rewardsResult = await client.query(
        "SELECT * FROM quest_rewards WHERE quest_id = $1",
        [questId],
      );

      const rewardsGiven = [];
      for (const reward of rewardsResult.rows) {
        if (reward.reward_type === "exp") {
          await client.query(
            `UPDATE player_realms SET current_exp = current_exp + $1, updated_at = NOW() WHERE player_id = $2`,
            [reward.reward_value, playerId],
          );
          rewardsGiven.push({ type: "exp", value: reward.reward_value.toString() });
        } else if (["spirit_stones", "immortal_jade", "honor_points"].includes(reward.reward_type)) {
          const col = reward.reward_type;
          await client.query(
            `UPDATE player_currencies SET ${col} = ${col} + $1, updated_at = NOW() WHERE player_id = $2`,
            [reward.reward_value, playerId],
          );
          rewardsGiven.push({ type: col, value: reward.reward_value.toString() });
        } else if (reward.reward_type === "item" && reward.item_id) {
          await client.query(
            `INSERT INTO player_inventory (player_id, item_id, quantity)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (player_id, item_id)
                         DO UPDATE SET quantity = player_inventory.quantity + EXCLUDED.quantity`,
            [playerId, reward.item_id, reward.item_quantity || 1],
          );
          rewardsGiven.push({ type: "item", itemId: reward.item_id, quantity: reward.item_quantity });
        }
      }

      // 標記任務完成
      await client.query(
        `UPDATE player_quests SET status = 'completed', completed_at = NOW()
                 WHERE player_id = $1 AND quest_id = $2`,
        [playerId, questId],
      );

      await client.query("COMMIT");
      res.json({ message: "任務完成！", rewards: rewardsGiven });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("完成任務錯誤:", error);
      res.status(500).json({ error: "完成任務失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 放棄任務
   */
  async abandonQuest(req, res) {
    const playerId = req.user.playerId;
    const { questId } = req.body;

    if (!questId) return res.status(400).json({ error: "請提供任務 ID" });

    try {
      const result = await pool.query(
        `UPDATE player_quests SET status = 'abandoned'
                 WHERE player_id = $1 AND quest_id = $2 AND status = 'in_progress'
                 RETURNING quest_id`,
        [playerId, questId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "找不到進行中的任務" });
      }
      res.json({ message: "任務已放棄" });
    } catch (error) {
      console.error("放棄任務錯誤:", error);
      res.status(500).json({ error: "放棄任務失敗" });
    }
  }
}

module.exports = new QuestController();
