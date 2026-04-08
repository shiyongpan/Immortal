const logger = require("./logger");

/**
 * 自動更新玩家進行中的任務進度
 * @param {object} client   - pg transaction client（或 pool）
 * @param {number} playerId
 * @param {string} stepType - "kill" | "collect" | "reach_realm"
 * @param {number} targetId - monster_id / item_id / realm_id
 * @param {number} incrementBy - 增加的數量（預設 1）
 */
async function updateQuestProgress(client, playerId, stepType, targetId, incrementBy = 1) {
  try {
    // 找到進行中且有對應步驟的任務
    const stepsResult = await client.query(
      `SELECT pq.id AS pq_id, pq.step_progress, qs.step_order, qs.required_count
       FROM player_quests pq
       JOIN quest_steps qs ON pq.quest_id = qs.quest_id
       WHERE pq.player_id = $1
         AND pq.status = 'in_progress'
         AND qs.step_type = $2
         AND qs.target_id = $3`,
      [playerId, stepType, targetId],
    );

    for (const row of stepsResult.rows) {
      const key = `step_${row.step_order}`;
      const progress = row.step_progress || {};
      const current = Number(progress[key] || 0);

      // 已達到上限就跳過
      if (current >= row.required_count) continue;

      progress[key] = Math.min(row.required_count, current + incrementBy);

      await client.query(
        `UPDATE player_quests SET step_progress = $1 WHERE id = $2`,
        [JSON.stringify(progress), row.pq_id],
      );
    }
  } catch (err) {
    // 任務進度失敗不影響主流程，只記 log
    logger.error("自動更新任務進度錯誤:", err);
  }
}

module.exports = { updateQuestProgress };
