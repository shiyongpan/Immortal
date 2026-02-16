# 修仙 RPG 遊戲後端設計路線圖

## 📋 目錄

- [技術棧總覽](#技術棧總覽)
- [資料庫總體設計](#資料庫總體設計)
- [開發階段規劃](#開發階段規劃)
- [詳細實作指南](#詳細實作指南)

---

## 技術棧總覽

```yaml
後端框架: Node.js + Express
資料庫: PostgreSQL 14+
即時通訊: WebSocket (ws)
身份驗證: JWT (jsonwebtoken)
密碼加密: bcrypt
ORM: pg (純 SQL) 或 Sequelize
資料驗證: Joi
日誌: Winston
環境變數: dotenv
```

### 專案結構

```
immortal-backend/
├── src/
│   ├── config/          # 配置檔案
│   │   ├── database.js
│   │   └── jwt.js
│   ├── models/          # 資料模型
│   ├── controllers/     # 業務邏輯
│   ├── routes/          # API 路由
│   ├── middleware/      # 中介軟體
│   ├── services/        # 服務層
│   ├── websocket/       # WebSocket 處理
│   └── utils/           # 工具函數
├── migrations/          # 資料庫遷移
├── seeds/              # 初始資料
├── tests/              # 測試
├── .env                # 環境變數
├── package.json
└── server.js           # 入口
```

---

## 資料庫總體設計

### 核心資料表關係圖

```
players (玩家)
  ├─→ player_stats (屬性)
  ├─→ player_realms (境界)
  ├─→ player_inventory (背包)
  ├─→ player_equipment (裝備)
  ├─→ player_skills (技能)
  ├─→ player_quests (任務進度)
  └─→ player_currencies (貨幣)

realms (境界體系)
  └─→ realm_stages (境界階段)

items (物品)
  ├─→ item_types (物品類型)
  └─→ item_effects (物品效果)

skills (技能)
  └─→ skill_levels (技能等級)

monsters (怪物)
  ├─→ monster_skills (怪物技能)
  └─→ monster_drops (掉落表)

quests (任務)
  └─→ quest_rewards (任務獎勵)
```

---

## 開發階段規劃

### 🎯 里程碑時間表

| 階段        | 功能                | 預計時間 | 狀態      |
| ----------- | ------------------- | -------- | --------- |
| **Phase 1** | 基礎架構 + 玩家系統 | 1-2 週   | 🔄 進行中 |
| **Phase 2** | 境界系統完善        | 1 週     | ⏳ 待開始 |
| **Phase 3** | 物品與裝備          | 1-2 週   | ⏳ 待開始 |
| **Phase 4** | 技能系統            | 1 週     | ⏳ 待開始 |
| **Phase 5** | 戰鬥系統            | 2 週     | ⏳ 待開始 |
| **Phase 6** | 社交與經濟          | 1-2 週   | ⏳ 待開始 |
| **Phase 7** | 任務系統            | 1-2 週   | ⏳ 待開始 |
| **Phase 8** | 優化與測試          | 持續進行 | ⏳ 待開始 |

---

## 詳細實作指南

---

## Phase 1: 基礎架構 + 玩家系統 (1-2 週)

### 📊 資料庫設計

#### 1.1 玩家主表

```sql
-- 玩家基本資料表
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引優化
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_last_login ON players(last_login);
```

#### 1.2 玩家屬性表

```sql
-- 玩家基礎屬性
CREATE TABLE player_stats (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 基礎屬性
    level INT DEFAULT 1,
    current_exp BIGINT DEFAULT 0,
    required_exp BIGINT DEFAULT 100,

    -- 戰鬥屬性
    max_hp INT DEFAULT 100,
    current_hp INT DEFAULT 100,
    max_mp INT DEFAULT 50,
    current_mp INT DEFAULT 50,
    attack INT DEFAULT 10,
    defense INT DEFAULT 5,
    speed INT DEFAULT 5,
    critical_rate DECIMAL(5,2) DEFAULT 5.00,  -- 暴擊率 %
    critical_damage DECIMAL(5,2) DEFAULT 150.00, -- 暴擊傷害 %

    -- 修煉屬性
    cultivation_speed DECIMAL(5,2) DEFAULT 1.00, -- 修煉速度倍率
    breakthrough_success_rate DECIMAL(5,2) DEFAULT 50.00, -- 突破成功率 %

    updated_at TIMESTAMP DEFAULT NOW()
);

-- 自動創建玩家屬性觸發器
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_player_stats
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_stats();
```

#### 1.3 玩家貨幣表

```sql
-- 玩家貨幣系統
CREATE TABLE player_currencies (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 各種貨幣
    spirit_stones BIGINT DEFAULT 0,      -- 靈石（主要貨幣）
    immortal_jade INT DEFAULT 0,         -- 仙玉（付費貨幣）
    contribution_points INT DEFAULT 0,   -- 貢獻點
    honor_points INT DEFAULT 0,          -- 榮譽點

    updated_at TIMESTAMP DEFAULT NOW()
);

-- 自動創建貨幣記錄觸發器
CREATE OR REPLACE FUNCTION create_player_currencies()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_currencies (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_player_currencies
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_currencies();
```

#### 1.4 玩家境界表（改進版）

```sql
-- 玩家當前境界
CREATE TABLE player_realms (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    current_realm_id INT REFERENCES realms(id),
    current_stage_id INT REFERENCES realm_stages(id),
    current_exp BIGINT DEFAULT 0,
    breakthrough_attempts INT DEFAULT 0,
    total_breakthroughs INT DEFAULT 0,
    last_breakthrough_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 境界突破歷史記錄
CREATE TABLE player_realm_history (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    from_stage_id INT REFERENCES realm_stages(id),
    to_stage_id INT REFERENCES realm_stages(id),
    success BOOLEAN NOT NULL,
    is_extreme BOOLEAN DEFAULT FALSE,
    breakthrough_time TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_realm_history_player ON player_realm_history(player_id);
```

### 🔌 API 設計

#### 1.5 玩家系統 API 端點

```javascript
// routes/auth.routes.js

/**
 * 身份驗證路由
 */

// POST /api/auth/register - 註冊新玩家
// Body: { username, email, password, displayName }
// Response: { token, player: {...} }

// POST /api/auth/login - 玩家登入
// Body: { username/email, password }
// Response: { token, player: {...} }

// POST /api/auth/logout - 登出
// Headers: Authorization: Bearer <token>
// Response: { message: "Logged out successfully" }

// GET /api/auth/verify - 驗證 Token
// Headers: Authorization: Bearer <token>
// Response: { valid: true, player: {...} }

// POST /api/auth/refresh - 刷新 Token
// Headers: Authorization: Bearer <token>
// Response: { token: "new_token" }
```

```javascript
// routes/player.routes.js

/**
 * 玩家資料路由
 */

// GET /api/players/:id - 獲取玩家資料
// Response: { player, stats, currencies, realm }

// PUT /api/players/:id - 更新玩家資料
// Body: { displayName, avatarUrl }
// Response: { player }

// GET /api/players/:id/stats - 獲取玩家屬性
// Response: { stats }

// GET /api/players/:id/currencies - 獲取玩家貨幣
// Response: { currencies }

// POST /api/players/:id/currencies/add - 增加貨幣（管理員）
// Body: { currencyType, amount }
// Response: { currencies }
```

### 💻 實作範例

#### 1.6 玩家註冊 Controller

```javascript
// controllers/auth.controller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

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
          error: "用戶名、郵箱和密碼為必填項",
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
        { expiresIn: "7d" },
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
      res.status(500).json({ error: "註冊失敗，請稍後重試" });
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
        { expiresIn: "7d" },
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
      res.status(500).json({ error: "登入失敗，請稍後重試" });
    }
  }

  /**
   * 獲取玩家完整資料
   */
  async getPlayerData(req, res) {
    const playerId = req.user.playerId; // 從 JWT 中間件獲取

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
```

#### 1.7 JWT 中間件

```javascript
// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

/**
 * 驗證 JWT Token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "未提供認證 Token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token 無效或已過期" });
    }

    req.user = user; // { playerId, username }
    next();
  });
};

/**
 * 驗證管理員權限（可選）
 */
const requireAdmin = async (req, res, next) => {
  // 實作管理員檢查邏輯
  // 可以在 players 表加 is_admin 欄位
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
```

#### 1.8 路由設定

```javascript
// routes/index.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// 身份驗證路由（無需認證）
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);

// 玩家資料路由（需要認證）
router.get("/player/me", authenticateToken, authController.getPlayerData);

module.exports = router;
```

---

## Phase 2: 完善境界系統 (1 週)

### 📊 資料庫設計（已完成）

境界表已在之前設計完成，這裡補充初始資料：

#### 2.1 境界初始資料

```sql
-- 插入境界資料
INSERT INTO realms (realm_name, realm_name_en, realm_order, description) VALUES
('凡人境', 'Mortal', 1, '修仙之路的起點，凡胎肉體'),
('靈者境', 'Spirit', 2, '初窺天地靈氣，踏入修仙門檻'),
('聖者境', 'Saint', 3, '超凡入聖，已非凡俗'),
('帝者境', 'Emperor', 4, '君臨天下，掌控一方'),
('神者境', 'Divine', 5, '羽化登仙，與天地同壽');

-- 插入境界階段（以凡人境為例）
INSERT INTO realm_stages (
    realm_id, stage_name, stage_name_en, stage_order, is_extreme,
    base_hp, base_attack, base_defense, base_speed,
    exp_required, breakthrough_item, unlocked_skills, accessible_areas
) VALUES
(1, '初期', 'Early', 1, false, 100, 10, 5, 5, 100, NULL, ARRAY['基礎攻擊'], ARRAY['新手村']),
(1, '中期', 'Middle', 2, false, 150, 15, 8, 6, 300, NULL, ARRAY['基礎攻擊', '輕功'], ARRAY['新手村', '森林']),
(1, '後期', 'Late', 3, false, 200, 20, 12, 7, 600, NULL, ARRAY['基礎攻擊', '輕功', '迴旋斬'], ARRAY['新手村', '森林', '山谷']),
(1, '巔峰', 'Peak', 4, false, 250, 25, 15, 8, 1000, '築基丹', ARRAY['基礎攻擊', '輕功', '迴旋斬', '劍氣'], ARRAY['新手村', '森林', '山谷']),
(1, '極境', 'Extreme', 5, true, 300, 35, 20, 10, 2000, '破境丹', ARRAY['基礎攻擊', '輕功', '迴旋斬', '劍氣', '破空斬'], ARRAY['新手村', '森林', '山谷', '禁地入口']);

-- 其他境界階段類似插入（靈者境、聖者境...）
-- 屬性倍率：每個境界比上一個境界 *2
```

### 🔌 API 設計

```javascript
// routes/realm.routes.js

/**
 * 境界系統 API
 */

// GET /api/realms - 獲取所有境界資料
// Response: [ { realm, stages: [...] } ]

// GET /api/realms/:id/stages - 獲取特定境界的階段
// Response: { stages: [...] }

// POST /api/player/realm/breakthrough - 嘗試突破境界
// Body: { useItem: boolean }
// Response: { success, newStage, rewards }

// GET /api/player/realm/history - 獲取突破歷史
// Response: { history: [...] }

// POST /api/player/realm/add-exp - 增加境界經驗
// Body: { amount }
// Response: { currentExp, requiredExp, levelUp: boolean }
```

### 💻 實作範例

#### 2.2 境界突破 Controller

```javascript
// controllers/realm.controller.js
const pool = require("../config/database");

class RealmController {
  /**
   * 境界突破
   */
  async breakthrough(req, res) {
    const playerId = req.user.playerId;
    const { useItem } = req.body; // 是否使用突破道具

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. 獲取玩家當前境界資訊
      const playerRealmResult = await client.query(
        `SELECT pr.*, rs.stage_order, rs.is_extreme, rs.exp_required,
                        rs.breakthrough_item, r.realm_order
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
      if (playerRealm.current_exp < playerRealm.exp_required) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "經驗值不足",
          required: playerRealm.exp_required,
          current: playerRealm.current_exp,
        });
      }

      // 3. 檢查是否需要突破道具
      if (playerRealm.breakthrough_item && !useItem) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "需要使用突破道具",
          requiredItem: playerRealm.breakthrough_item,
        });
      }

      // 4. 計算突破成功率
      let successRate = 100; // 基礎成功率

      if (playerRealm.is_extreme) {
        // 極境突破有失敗機率
        successRate = 50; // 基礎 50%

        // 使用道具可以提高成功率
        if (useItem) {
          successRate += 30; // 道具加成
        }
      }

      // 5. 判定突破結果
      const random = Math.random() * 100;
      const success = random < successRate;

      // 6. 獲取下一個階段
      let nextStageId = null;
      if (success) {
        const nextStageResult = await client.query(
          `SELECT id FROM realm_stages
                     WHERE realm_id = $1 AND stage_order = $2
                     LIMIT 1`,
          [playerRealm.current_realm_id, playerRealm.stage_order + 1],
        );

        if (nextStageResult.rows.length > 0) {
          nextStageId = nextStageResult.rows[0].id;
        } else {
          // 當前境界已滿，需要進入下一個境界
          const nextRealmResult = await client.query(
            `SELECT id FROM realms
                         WHERE realm_order = $1
                         LIMIT 1`,
            [playerRealm.realm_order + 1],
          );

          if (nextRealmResult.rows.length > 0) {
            const nextRealmId = nextRealmResult.rows[0].id;

            // 獲取下一境界的初期階段
            const firstStageResult = await client.query(
              `SELECT id FROM realm_stages
                             WHERE realm_id = $1 AND stage_order = 1
                             LIMIT 1`,
              [nextRealmId],
            );

            if (firstStageResult.rows.length > 0) {
              nextStageId = firstStageResult.rows[0].id;

              // 更新境界
              await client.query(
                `UPDATE player_realms
                                 SET current_realm_id = $1
                                 WHERE player_id = $2`,
                [nextRealmId, playerId],
              );
            }
          }
        }
      }

      // 7. 更新玩家境界
      if (success && nextStageId) {
        await client.query(
          `UPDATE player_realms
                     SET current_stage_id = $1,
                         current_exp = 0,
                         breakthrough_attempts = 0,
                         total_breakthroughs = total_breakthroughs + 1,
                         last_breakthrough_at = NOW()
                     WHERE player_id = $2`,
          [nextStageId, playerId],
        );

        // 更新玩家屬性（根據新境界加成）
        const newStageResult = await client.query(
          `SELECT base_hp, base_attack, base_defense, base_speed
                     FROM realm_stages WHERE id = $1`,
          [nextStageId],
        );

        const newStage = newStageResult.rows[0];

        await client.query(
          `UPDATE player_stats
                     SET max_hp = max_hp + $1,
                         current_hp = current_hp + $1,
                         attack = attack + $2,
                         defense = defense + $3,
                         speed = speed + $4
                     WHERE player_id = $5`,
          [
            newStage.base_hp,
            newStage.base_attack,
            newStage.base_defense,
            newStage.base_speed,
            playerId,
          ],
        );
      } else {
        // 突破失敗，增加嘗試次數
        await client.query(
          `UPDATE player_realms
                     SET breakthrough_attempts = breakthrough_attempts + 1,
                         current_exp = current_exp - ($1 * 0.5)
                     WHERE player_id = $2`,
          [playerRealm.exp_required, playerId],
        );
      }

      // 8. 記錄突破歷史
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

      await client.query("COMMIT");

      // 9. 返回結果
      res.json({
        success,
        message: success ? "突破成功！" : "突破失敗...",
        successRate,
        newStageId: nextStageId,
        expLost: success ? 0 : Math.floor(playerRealm.exp_required * 0.5),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("突破錯誤:", error);
      res.status(500).json({ error: "突破失敗，請稍後重試" });
    } finally {
      client.release();
    }
  }

  /**
   * 增加境界經驗
   */
  async addExp(req, res) {
    const playerId = req.user.playerId;
    const { amount } = req.body;

    try {
      // 獲取當前境界資訊
      const result = await pool.query(
        `SELECT pr.current_exp, rs.exp_required
                 FROM player_realms pr
                 JOIN realm_stages rs ON pr.current_stage_id = rs.id
                 WHERE pr.player_id = $1`,
        [playerId],
      );

      const current = result.rows[0];
      const newExp = current.current_exp + amount;
      const levelUp = newExp >= current.exp_required;

      // 更新經驗值
      await pool.query(
        `UPDATE player_realms
                 SET current_exp = $1
                 WHERE player_id = $2`,
        [newExp, playerId],
      );

      res.json({
        currentExp: newExp,
        requiredExp: current.exp_required,
        levelUp,
        canBreakthrough: levelUp,
      });
    } catch (error) {
      console.error("增加經驗錯誤:", error);
      res.status(500).json({ error: "增加經驗失敗" });
    }
  }

  /**
   * 獲取所有境界資料
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
                            'base_hp', rs.base_hp,
                            'base_attack', rs.base_attack,
                            'base_defense', rs.base_defense,
                            'base_speed', rs.base_speed,
                            'exp_required', rs.exp_required,
                            'breakthrough_item', rs.breakthrough_item
                        ) ORDER BY rs.stage_order
                    ) as stages
                 FROM realms r
                 LEFT JOIN realm_stages rs ON r.id = rs.realm_id
                 GROUP BY r.id
                 ORDER BY r.realm_order`,
      );

      res.json({ realms: result.rows });
    } catch (error) {
      console.error("獲取境界資料錯誤:", error);
      res.status(500).json({ error: "獲取境界資料失敗" });
    }
  }
}

module.exports = new RealmController();
```

---

## Phase 3: 物品與裝備系統 (1-2 週)

### 📊 資料庫設計

#### 3.1 物品類型表

```sql
-- 物品類型
CREATE TABLE item_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,  -- 消耗品、裝備、材料等
    description TEXT
);

INSERT INTO item_types (type_name, description) VALUES
('consumable', '消耗品'),
('equipment', '裝備'),
('material', '材料'),
('quest', '任務物品'),
('special', '特殊物品');
```

#### 3.2 物品主表

```sql
-- 物品資料表
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_type_id INT REFERENCES item_types(id),
    description TEXT,
    icon_url VARCHAR(255),

    -- 物品屬性
    rarity VARCHAR(20) DEFAULT 'common',  -- common, uncommon, rare, epic, legendary
    level_required INT DEFAULT 1,
    max_stack INT DEFAULT 99,
    is_tradeable BOOLEAN DEFAULT true,
    is_droppable BOOLEAN DEFAULT true,

    -- 價格
    buy_price INT DEFAULT 0,
    sell_price INT DEFAULT 0,

    -- 效果（JSON）
    effects JSONB,
    -- 例如: {"hp_restore": 100, "mp_restore": 50}
    -- 或: {"attack": 10, "defense": 5}

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_type ON items(item_type_id);
CREATE INDEX idx_items_rarity ON items(rarity);
```

#### 3.3 裝備詳細表

```sql
-- 裝備專用表（擴展 items）
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    item_id INT UNIQUE REFERENCES items(id) ON DELETE CASCADE,

    -- 裝備位置
    slot VARCHAR(20) NOT NULL,  -- weapon, helmet, armor, boots, accessory

    -- 基礎屬性
    base_attack INT DEFAULT 0,
    base_defense INT DEFAULT 0,
    base_hp INT DEFAULT 0,
    base_mp INT DEFAULT 0,
    base_speed INT DEFAULT 0,

    -- 進階屬性
    critical_rate DECIMAL(5,2) DEFAULT 0,
    critical_damage DECIMAL(5,2) DEFAULT 0,

    -- 強化系統
    max_enhancement_level INT DEFAULT 10,
    enhancement_success_rate DECIMAL(5,2) DEFAULT 80.00,

    -- 套裝系統
    set_id INT,
    set_bonus JSONB
);
```

#### 3.4 玩家背包表

```sql
-- 玩家背包
CREATE TABLE player_inventory (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),
    quantity INT DEFAULT 1,

    -- 裝備專用（如果是裝備）
    enhancement_level INT DEFAULT 0,
    is_equipped BOOLEAN DEFAULT false,

    acquired_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_player_item UNIQUE(player_id, item_id)
);

CREATE INDEX idx_inventory_player ON player_inventory(player_id);
CREATE INDEX idx_inventory_equipped ON player_inventory(player_id, is_equipped);
```

#### 3.5 玩家裝備欄表

```sql
-- 玩家當前裝備
CREATE TABLE player_equipment (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 各部位裝備
    weapon_id INT REFERENCES items(id),
    helmet_id INT REFERENCES items(id),
    armor_id INT REFERENCES items(id),
    boots_id INT REFERENCES items(id),
    accessory_1_id INT REFERENCES items(id),
    accessory_2_id INT REFERENCES items(id),

    updated_at TIMESTAMP DEFAULT NOW()
);

-- 自動創建裝備欄
CREATE OR REPLACE FUNCTION create_player_equipment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_equipment (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_player_equipment
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_equipment();
```

### 🔌 API 設計

```javascript
/**
 * 物品系統 API
 */

// GET /api/items - 獲取所有物品
// Query: ?type=consumable&rarity=rare

// GET /api/items/:id - 獲取物品詳情

// GET /api/player/inventory - 獲取玩家背包
// Response: { items: [...], maxSlots: 100 }

// POST /api/player/inventory/use - 使用物品
// Body: { itemId, quantity }

// POST /api/player/inventory/equip - 裝備物品
// Body: { inventoryItemId, slot }

// POST /api/player/inventory/unequip - 卸下裝備
// Body: { slot }

// POST /api/player/equipment/enhance - 強化裝備
// Body: { inventoryItemId }

// DELETE /api/player/inventory/:id - 丟棄物品
```

### 💻 實作範例

#### 3.6 物品使用 Controller

```javascript
// controllers/inventory.controller.js
class InventoryController {
  /**
   * 使用物品
   */
  async useItem(req, res) {
    const playerId = req.user.playerId;
    const { itemId, quantity = 1 } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. 檢查物品是否存在於背包
      const inventoryResult = await client.query(
        `SELECT pi.*, i.item_type_id, i.effects
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 WHERE pi.player_id = $1 AND pi.item_id = $2`,
        [playerId, itemId],
      );

      if (inventoryResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "物品不存在" });
      }

      const inventoryItem = inventoryResult.rows[0];

      // 2. 檢查數量
      if (inventoryItem.quantity < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "物品數量不足" });
      }

      // 3. 檢查物品類型（只有消耗品可以使用）
      const typeResult = await client.query(
        "SELECT type_name FROM item_types WHERE id = $1",
        [inventoryItem.item_type_id],
      );

      if (typeResult.rows[0].type_name !== "consumable") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "該物品無法使用" });
      }

      // 4. 應用物品效果
      const effects = inventoryItem.effects;
      const updates = [];
      const values = [playerId];
      let paramIndex = 2;

      if (effects.hp_restore) {
        updates.push(`current_hp = LEAST(current_hp + $${paramIndex}, max_hp)`);
        values.push(effects.hp_restore * quantity);
        paramIndex++;
      }

      if (effects.mp_restore) {
        updates.push(`current_mp = LEAST(current_mp + $${paramIndex}, max_mp)`);
        values.push(effects.mp_restore * quantity);
        paramIndex++;
      }

      if (updates.length > 0) {
        await client.query(
          `UPDATE player_stats SET ${updates.join(", ")} WHERE player_id = $1`,
          values,
        );
      }

      // 5. 減少物品數量
      const newQuantity = inventoryItem.quantity - quantity;
      if (newQuantity > 0) {
        await client.query(
          "UPDATE player_inventory SET quantity = $1 WHERE id = $2",
          [newQuantity, inventoryItem.id],
        );
      } else {
        await client.query("DELETE FROM player_inventory WHERE id = $1", [
          inventoryItem.id,
        ]);
      }

      await client.query("COMMIT");

      res.json({
        message: "使用成功",
        effects: effects,
        remainingQuantity: newQuantity,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("使用物品錯誤:", error);
      res.status(500).json({ error: "使用物品失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 裝備物品
   */
  async equipItem(req, res) {
    const playerId = req.user.playerId;
    const { inventoryItemId } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. 獲取物品資訊
      const itemResult = await client.query(
        `SELECT pi.*, e.slot, e.base_attack, e.base_defense, 
                        e.base_hp, e.base_mp, e.base_speed
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 JOIN equipment e ON i.id = e.item_id
                 WHERE pi.id = $1 AND pi.player_id = $2`,
        [inventoryItemId, playerId],
      );

      if (itemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到該裝備" });
      }

      const equipment = itemResult.rows[0];

      // 2. 檢查該位置是否已有裝備
      const slotColumn = `${equipment.slot}_id`;
      const currentEquipResult = await client.query(
        `SELECT ${slotColumn} FROM player_equipment WHERE player_id = $1`,
        [playerId],
      );

      const currentEquipId = currentEquipResult.rows[0][slotColumn];

      // 3. 如果有舊裝備，先卸下
      if (currentEquipId) {
        await client.query(
          `UPDATE player_inventory SET is_equipped = false 
                     WHERE player_id = $1 AND item_id = $2`,
          [playerId, currentEquipId],
        );
      }

      // 4. 裝備新裝備
      await client.query(
        `UPDATE player_equipment SET ${slotColumn} = $1 WHERE player_id = $2`,
        [equipment.item_id, playerId],
      );

      await client.query(
        `UPDATE player_inventory SET is_equipped = true WHERE id = $1`,
        [inventoryItemId],
      );

      // 5. 更新玩家屬性
      await client.query(
        `UPDATE player_stats
                 SET attack = attack + $1,
                     defense = defense + $2,
                     max_hp = max_hp + $3,
                     max_mp = max_mp + $4,
                     speed = speed + $5
                 WHERE player_id = $6`,
        [
          equipment.base_attack,
          equipment.base_defense,
          equipment.base_hp,
          equipment.base_mp,
          equipment.base_speed,
          playerId,
        ],
      );

      await client.query("COMMIT");

      res.json({
        message: "裝備成功",
        slot: equipment.slot,
        itemId: equipment.item_id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("裝備錯誤:", error);
      res.status(500).json({ error: "裝備失敗" });
    } finally {
      client.release();
    }
  }
}

module.exports = new InventoryController();
```

---

## Phase 4-7: 後續系統（概要）

由於文檔已經很長，後續系統提供概要設計：

### Phase 4: 技能系統

- **資料表**: skills, skill_levels, player_skills
- **核心功能**: 技能學習、升級、冷卻管理
- **API**: 學習技能、使用技能、升級技能

### Phase 5: 戰鬥系統

- **資料表**: monsters, monster_skills, battle_logs, monster_drops
- **核心功能**: 傷害計算、戰鬥結算、經驗掉落
- **API**: 發起戰鬥、戰鬥回合、戰鬥結束

### Phase 6: 社交與經濟

- **資料表**: leaderboards, shops, shop_items, transactions
- **核心功能**: 排行榜、商城、交易
- **API**: 查詢排行榜、購買物品、玩家交易

### Phase 7: 任務系統

- **資料表**: quests, quest_steps, quest_rewards, player_quests
- **核心功能**: 任務接取、進度追蹤、獎勵發放
- **API**: 接任務、更新進度、完成任務

---

## WebSocket 事件設計

### 即時事件推送

```javascript
// WebSocket 事件類型
const WS_EVENTS = {
  // 玩家事件
  PLAYER_ONLINE: "player_online",
  PLAYER_OFFLINE: "player_offline",
  PLAYER_LEVEL_UP: "player_level_up",

  // 境界事件
  REALM_BREAKTHROUGH: "realm_breakthrough",
  REALM_EXP_GAINED: "realm_exp_gained",

  // 戰鬥事件
  BATTLE_START: "battle_start",
  BATTLE_ROUND: "battle_round",
  BATTLE_END: "battle_end",

  // 物品事件
  ITEM_OBTAINED: "item_obtained",
  ITEM_USED: "item_used",
  EQUIPMENT_CHANGED: "equipment_changed",

  // 聊天事件
  CHAT_MESSAGE: "chat_message",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
};

// WebSocket 處理器範例
wss.on("connection", (ws, req) => {
  // 驗證 Token
  const token = req.headers["sec-websocket-protocol"];
  const user = verifyToken(token);

  if (!user) {
    ws.close(1008, "Unauthorized");
    return;
  }

  ws.playerId = user.playerId;

  // 廣播玩家上線
  broadcast({
    type: WS_EVENTS.PLAYER_ONLINE,
    data: { playerId: user.playerId },
  });

  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "BATTLE_ACTION":
        await handleBattleAction(ws, data);
        break;
      case "CHAT_MESSAGE":
        await handleChatMessage(ws, data);
        break;
    }
  });
});
```

---

## 環境配置

### .env 範例

```env
# 伺服器配置
PORT=3000
NODE_ENV=development

# 資料庫配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=immortal_game
DB_USER=your_username
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# WebSocket 配置
WS_PORT=3001
```

### package.json

```json
{
  "name": "immortal-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node migrations/run.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 開發檢查清單

### Phase 1 ✅

- [ ] 安裝 PostgreSQL 並創建資料庫
- [ ] 創建玩家相關資料表
- [ ] 實作註冊 API
- [ ] 實作登入 API
- [ ] 實作 JWT 驗證中間件
- [ ] 測試玩家系統

### Phase 2 ✅

- [ ] 插入境界初始資料
- [ ] 實作境界突破 API
- [ ] 實作經驗值增加 API
- [ ] 測試境界系統
- [ ] 整合 WebSocket 推送

### Phase 3 ⏳

- [ ] 創建物品資料表
- [ ] 實作背包系統
- [ ] 實作裝備系統
- [ ] 實作物品使用邏輯
- [ ] 測試物品系統

---

## 總結

這份後端設計路線圖提供了：

1. **完整的資料庫設計** - 從玩家到裝備的所有資料表
2. **詳細的 API 設計** - RESTful API 端點規劃
3. **實作範例** - 包含完整的 Controller 程式碼
4. **WebSocket 整合** - 即時事件推送
5. **階段性開發** - 7 個開發階段，循序漸進

**下一步行動：**

1. 設置開發環境
2. 創建資料庫和資料表
3. 開始實作 Phase 1 的玩家系統
4. 逐步完成各個 Phase

需要任何階段的更詳細說明，隨時告訴我！
