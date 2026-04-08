const logger = require("../utils/logger");
const pool = require("../config/database");

class SkillController {
  /**
   * 獲取所有技能（依當前境界篩選可學習的）
   */
  async getAvailableSkills(req, res) {
    const playerId = req.user.playerId;
    try {
      // 獲取玩家當前境界
      const realmResult = await pool.query(
        `SELECT pr.current_realm_id FROM player_realms pr WHERE pr.player_id = $1`,
        [playerId],
      );
      const realmId = realmResult.rows[0]?.current_realm_id;

      const result = await pool.query(
        `SELECT s.*,
                    r.realm_name as realm_required_name,
                    ps.current_level as player_level,
                    ps.is_equipped as is_player_equipped
                 FROM skills s
                 LEFT JOIN realms r ON s.realm_required = r.id
                 LEFT JOIN player_skills ps ON s.id = ps.skill_id AND ps.player_id = $1
                 WHERE s.realm_required IS NULL OR s.realm_required <= $2
                 ORDER BY r.realm_order, s.level_required`,
        [playerId, realmId],
      );
      res.json({ skills: result.rows });
    } catch (error) {
      logger.error("獲取技能列表錯誤:", error);
      res.status(500).json({ error: "獲取技能列表失敗" });
    }
  }

  /**
   * 獲取玩家已學技能
   */
  async getPlayerSkills(req, res) {
    const playerId = req.user.playerId;
    try {
      const result = await pool.query(
        `SELECT ps.id, ps.current_level, ps.is_equipped, ps.slot_index, ps.learned_at,
                    s.skill_name, s.description, s.skill_type, s.mp_cost, s.cooldown_seconds,
                    s.effects, s.max_level, s.icon_url,
                    sl.effects as level_effects, sl.mp_cost as level_mp_cost
                 FROM player_skills ps
                 JOIN skills s ON ps.skill_id = s.id
                 LEFT JOIN skill_levels sl ON s.id = sl.skill_id AND ps.current_level = sl.level
                 WHERE ps.player_id = $1
                 ORDER BY ps.is_equipped DESC, ps.slot_index, s.skill_name`,
        [playerId],
      );
      res.json({ skills: result.rows });
    } catch (error) {
      logger.error("獲取玩家技能錯誤:", error);
      res.status(500).json({ error: "獲取玩家技能失敗" });
    }
  }

  /**
   * 學習技能
   */
  async learnSkill(req, res) {
    const playerId = req.user.playerId;
    const { skillId } = req.body;

    if (!skillId) return res.status(400).json({ error: "請提供技能 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 檢查技能是否存在
      const skillResult = await client.query(
        "SELECT * FROM skills WHERE id = $1",
        [skillId],
      );
      if (skillResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "技能不存在" });
      }

      const skill = skillResult.rows[0];

      // 檢查是否已學習
      const learnedResult = await client.query(
        "SELECT id FROM player_skills WHERE player_id = $1 AND skill_id = $2",
        [playerId, skillId],
      );
      if (learnedResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "已學習此技能" });
      }

      // 檢查境界需求
      if (skill.realm_required) {
        const realmResult = await client.query(
          `SELECT r.realm_order FROM player_realms pr
                     JOIN realms r ON pr.current_realm_id = r.id
                     WHERE pr.player_id = $1`,
          [playerId],
        );
        const requiredRealm = await client.query(
          "SELECT realm_order FROM realms WHERE id = $1",
          [skill.realm_required],
        );
        if (realmResult.rows[0].realm_order < requiredRealm.rows[0].realm_order) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "境界不足，無法學習此技能" });
        }
      }

      // 學習技能
      await client.query(
        "INSERT INTO player_skills (player_id, skill_id) VALUES ($1, $2)",
        [playerId, skillId],
      );

      await client.query("COMMIT");
      res.status(201).json({ message: "技能學習成功", skillName: skill.skill_name });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("學習技能錯誤:", error);
      res.status(500).json({ error: "學習技能失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 升級技能
   */
  async upgradeSkill(req, res) {
    const playerId = req.user.playerId;
    const { playerSkillId } = req.body;

    if (!playerSkillId) return res.status(400).json({ error: "請提供技能 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const psResult = await client.query(
        `SELECT ps.*, s.max_level FROM player_skills ps
                 JOIN skills s ON ps.skill_id = s.id
                 WHERE ps.id = $1 AND ps.player_id = $2`,
        [playerSkillId, playerId],
      );

      if (psResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "尚未學習此技能" });
      }

      const ps = psResult.rows[0];
      if (ps.current_level >= ps.max_level) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "技能已達最高等級" });
      }

      const nextLevel = ps.current_level + 1;
      const levelCostResult = await client.query(
        "SELECT level_up_cost FROM skill_levels WHERE skill_id = $1 AND level = $2",
        [ps.skill_id, nextLevel],
      );

      const cost = levelCostResult.rows[0]?.level_up_cost || 0;

      // 扣除靈石
      if (cost > 0) {
        const currResult = await client.query(
          "SELECT spirit_stones FROM player_currencies WHERE player_id = $1",
          [playerId],
        );
        if (BigInt(currResult.rows[0].spirit_stones) < BigInt(cost)) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "靈石不足", required: cost.toString() });
        }
        await client.query(
          `UPDATE player_currencies SET spirit_stones = spirit_stones - $1, updated_at = NOW() WHERE player_id = $2`,
          [cost, playerId],
        );
      }

      await client.query(
        "UPDATE player_skills SET current_level = $1 WHERE id = $2 AND player_id = $3",
        [nextLevel, playerSkillId, playerId],
      );

      await client.query("COMMIT");
      res.json({ message: "技能升級成功", newLevel: nextLevel, spiritStonesUsed: cost.toString() });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("技能升級錯誤:", error);
      res.status(500).json({ error: "技能升級失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 設置技能欄位
   */
  async setSkillSlot(req, res) {
    const playerId = req.user.playerId;
    const { skillId, slotIndex } = req.body;

    if (skillId === undefined || slotIndex === undefined) {
      return res.status(400).json({ error: "請提供技能 ID 和欄位索引" });
    }
    if (slotIndex < 0 || slotIndex > 5) {
      return res.status(400).json({ error: "技能欄位索引須為 0-5" });
    }

    try {
      // 清除該欄位原有技能
      await pool.query(
        `UPDATE player_skills SET is_equipped = false, slot_index = NULL
                 WHERE player_id = $1 AND slot_index = $2`,
        [playerId, slotIndex],
      );

      if (skillId === null) {
        return res.json({ message: "技能欄位已清空" });
      }

      await pool.query(
        `UPDATE player_skills SET is_equipped = true, slot_index = $1
                 WHERE player_id = $2 AND skill_id = $3`,
        [slotIndex, playerId, skillId],
      );

      res.json({ message: "技能欄位設置成功", slotIndex });
    } catch (error) {
      logger.error("設置技能欄錯誤:", error);
      res.status(500).json({ error: "設置技能欄失敗" });
    }
  }
}

module.exports = new SkillController();
