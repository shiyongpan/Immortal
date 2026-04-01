const pool = require("../config/database");

class LeaderboardController {
  /**
   * 獲取排行榜（即時查詢）
   */
  async getLeaderboard(req, res) {
    const { type = "realm" } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);

    const validTypes = ["realm", "level", "battle_wins", "spirit_stones"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "無效的排行榜類型" });
    }

    try {
      let query;
      if (type === "realm") {
        query = `
          SELECT p.id, p.username, p.display_name, p.avatar_url,
                 r.realm_name, rs.stage_name, rs.stage_order, rs.is_extreme,
                 r.realm_order,
                 ROW_NUMBER() OVER (ORDER BY r.realm_order DESC, rs.stage_order DESC, pr.total_breakthroughs DESC) as rank
          FROM players p
          JOIN player_realms pr ON p.id = pr.player_id
          JOIN realms r ON pr.current_realm_id = r.id
          JOIN realm_stages rs ON pr.current_stage_id = rs.id
          WHERE p.is_active = true AND p.is_banned = false
          ORDER BY r.realm_order DESC, rs.stage_order DESC, pr.total_breakthroughs DESC
          LIMIT $1`;
      } else if (type === "level") {
        query = `
          SELECT p.id, p.username, p.display_name, p.avatar_url,
                 ps.level, ps.current_exp,
                 ROW_NUMBER() OVER (ORDER BY ps.level DESC, ps.current_exp DESC) as rank
          FROM players p
          JOIN player_stats ps ON p.id = ps.player_id
          WHERE p.is_active = true AND p.is_banned = false
          ORDER BY ps.level DESC, ps.current_exp DESC
          LIMIT $1`;
      } else if (type === "battle_wins") {
        query = `
          SELECT p.id, p.username, p.display_name, p.avatar_url,
                 ps.battles_won, ps.total_battles, ps.monsters_killed,
                 ROW_NUMBER() OVER (ORDER BY ps.battles_won DESC) as rank
          FROM players p
          JOIN player_stats ps ON p.id = ps.player_id
          WHERE p.is_active = true AND p.is_banned = false
          ORDER BY ps.battles_won DESC
          LIMIT $1`;
      } else {
        query = `
          SELECT p.id, p.username, p.display_name, p.avatar_url,
                 pc.spirit_stones,
                 ROW_NUMBER() OVER (ORDER BY pc.spirit_stones DESC) as rank
          FROM players p
          JOIN player_currencies pc ON p.id = pc.player_id
          WHERE p.is_active = true AND p.is_banned = false
          ORDER BY pc.spirit_stones DESC
          LIMIT $1`;
      }

      const result = await pool.query(query, [limit]);
      res.json({ type, leaderboard: result.rows });
    } catch (error) {
      console.error("獲取排行榜錯誤:", error);
      res.status(500).json({ error: "獲取排行榜失敗" });
    }
  }

  /**
   * 獲取玩家自身排名
   */
  async getPlayerRank(req, res) {
    const playerId = req.user.playerId;
    const { type = "realm" } = req.params;

    const validTypes = ["realm", "level", "battle_wins", "spirit_stones"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "無效的排行榜類型" });
    }

    try {
      let query;
      if (type === "realm") {
        query = `
          SELECT COUNT(*) + 1 as rank FROM players p
          JOIN player_realms pr ON p.id = pr.player_id
          JOIN realms r ON pr.current_realm_id = r.id
          JOIN realm_stages rs ON pr.current_stage_id = rs.id
          WHERE p.is_active = true AND p.is_banned = false AND (
            r.realm_order > (SELECT r2.realm_order FROM player_realms pr2 JOIN realms r2 ON pr2.current_realm_id = r2.id WHERE pr2.player_id = $1)
            OR (r.realm_order = (SELECT r2.realm_order FROM player_realms pr2 JOIN realms r2 ON pr2.current_realm_id = r2.id WHERE pr2.player_id = $1)
                AND rs.stage_order > (SELECT rs2.stage_order FROM player_realms pr2 JOIN realm_stages rs2 ON pr2.current_stage_id = rs2.id WHERE pr2.player_id = $1))
          )`;
      } else if (type === "level") {
        query = `SELECT COUNT(*) + 1 as rank FROM player_stats
                 WHERE level > (SELECT level FROM player_stats WHERE player_id = $1)
                 OR (level = (SELECT level FROM player_stats WHERE player_id = $1)
                     AND current_exp > (SELECT current_exp FROM player_stats WHERE player_id = $1))`;
      } else if (type === "battle_wins") {
        query = `SELECT COUNT(*) + 1 as rank FROM player_stats
                 WHERE battles_won > (SELECT battles_won FROM player_stats WHERE player_id = $1)`;
      } else {
        query = `SELECT COUNT(*) + 1 as rank FROM player_currencies
                 WHERE spirit_stones > (SELECT spirit_stones FROM player_currencies WHERE player_id = $1)`;
      }

      const result = await pool.query(query, [playerId]);
      res.json({ type, rank: parseInt(result.rows[0].rank) });
    } catch (error) {
      console.error("獲取玩家排名錯誤:", error);
      res.status(500).json({ error: "獲取玩家排名失敗" });
    }
  }
}

module.exports = new LeaderboardController();
