const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
require("dotenv").config();

class AuthController {
  /**
   * 玩家註冊
   */
  async register(req, res) {
    const { username, email, password, displayName } = req.body;

    try {
      // 1. 驗證輸入
      if (!username || !email || !password) {
        return res.status(400).json({
          error: "用戶名、郵箱和密碼為sda必填項",
        });
      }

      // 2. 檢查用戶名是否存在
      const userCheck = await pool.query(
        "SELECT id FROM players WHERE username = $1 OR email = $2",
        [username, email],
      );

      if (userCheck.rows.length > 0) {
        return res.status(409).json({
          error: "用戶名或郵箱已存在",
        });
      }

      // 3. 密碼加密
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. 創建玩家
      const result = await pool.query(
        `INSERT INTO players (username, email, password_hash, display_name)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, username, email, display_name, created_at`,
        [username, email, passwordHash, displayName || username],
      );

      const player = result.rows[0];

      // 5. 生成 JWT Token
      const token = jwt.sign(
        { playerId: player.id, username: player.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );

      // 6. 返回結果
      res.status(201).json({
        message: "註冊成功",
        token,
        player: {
          id: player.id,
          username: player.username,
          email: player.email,
          displayName: player.display_name,
          createdAt: player.created_at,
        },
      });
    } catch (error) {
      console.error("註冊錯誤:", error);
      res.status(500).json({ error: "註冊失敗,請稍後重試" });
    }
  }

  /**
   * 玩家登入
   */
  async login(req, res) {
    const { login, password } = req.body; // login 可以是 username 或 email

    try {
      // 1. 查詢玩家
      const result = await pool.query(
        `SELECT id, username, email, password_hash, display_name, is_active, is_banned
                 FROM players
                 WHERE username = $1 OR email = $1`,
        [login],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "用戶名或密碼錯誤" });
      }

      const player = result.rows[0];

      // 2. 檢查帳號狀態
      if (player.is_banned) {
        return res.status(403).json({ error: "該帳號已被封禁" });
      }

      if (!player.is_active) {
        return res.status(403).json({ error: "該帳號未激活" });
      }

      // 3. 驗證密碼
      const validPassword = await bcrypt.compare(
        password,
        player.password_hash,
      );
      if (!validPassword) {
        return res.status(401).json({ error: "用戶名或密碼錯誤" });
      }

      // 4. 更新最後登入時間
      await pool.query("UPDATE players SET last_login = NOW() WHERE id = $1", [
        player.id,
      ]);

      // 5. 生成 Token
      const token = jwt.sign(
        { playerId: player.id, username: player.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );

      // 6. 返回結果
      res.json({
        message: "登入成功",
        token,
        player: {
          id: player.id,
          username: player.username,
          email: player.email,
          displayName: player.display_name,
        },
      });
    } catch (error) {
      console.error("登入錯誤:", error);
      res.status(500).json({ error: "登入失敗,請稍後重試" });
    }
  }

  /**
   * 驗證 Token
   */
  async verify(req, res) {
    // Token 已經在 middleware 中驗證過了
    res.json({
      valid: true,
      user: req.user,
    });
  }

  /**
   * 獲取玩家完整資料
   */
  async getPlayerData(req, res) {
    const playerId = req.user.playerId;

    try {
      const result = await pool.query(
        `SELECT
                    p.id, p.username, p.email, p.display_name, p.avatar_url,
                    ps.level, ps.current_exp, ps.required_exp,
                    ps.max_hp, ps.current_hp, ps.max_mp, ps.current_mp,
                    ps.attack, ps.defense, ps.speed,
                    pc.spirit_stones, pc.immortal_jade,
                    pr.current_exp as realm_exp,
                    r.realm_name, rs.stage_name
                FROM players p
                LEFT JOIN player_stats ps ON p.id = ps.player_id
                LEFT JOIN player_currencies pc ON p.id = pc.player_id
                LEFT JOIN player_realms pr ON p.id = pr.player_id
                LEFT JOIN realms r ON pr.current_realm_id = r.id
                LEFT JOIN realm_stages rs ON pr.current_stage_id = rs.id
                WHERE p.id = $1`,
        [playerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "玩家不存在" });
      }

      res.json({ player: result.rows[0] });
    } catch (error) {
      console.error("獲取玩家資料錯誤:", error);
      res.status(500).json({ error: "獲取資料失敗" });
    }
  }
}

module.exports = new AuthController();
