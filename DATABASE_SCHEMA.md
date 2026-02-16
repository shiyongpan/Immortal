# 📊 資料庫結構說明

## 1️⃣ players (玩家主表)

玩家的基本帳號資訊和身份驗證資料。

### 欄位說明

| 欄位 | 類型 | 說明 | 約束 |
|------|------|------|------|
| `id` | SERIAL | 玩家 ID | PRIMARY KEY |
| `username` | VARCHAR(50) | 用戶名 | UNIQUE, NOT NULL |
| `email` | VARCHAR(100) | 電子郵件 | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | 密碼 (bcrypt 加密) | NOT NULL |
| `display_name` | VARCHAR(50) | 顯示名稱 | - |
| `avatar_url` | VARCHAR(255) | 頭像 URL | - |
| `is_active` | BOOLEAN | 是否啟用 | DEFAULT true |
| `is_banned` | BOOLEAN | 是否封禁 | DEFAULT false |
| `ban_reason` | TEXT | 封禁原因 | - |
| `last_login` | TIMESTAMP | 最後登入時間 | - |
| `login_count` | INT | 登入次數 | DEFAULT 0 |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT NOW() |

### 索引
- `idx_players_username` - 用戶名索引
- `idx_players_email` - 郵件索引
- `idx_players_last_login` - 登入時間索引

---

## 2️⃣ player_stats (玩家屬性表)

玩家的遊戲屬性和戰鬥數據。

### 欄位說明

| 欄位 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `id` | SERIAL | 屬性 ID | - |
| `player_id` | INT | 玩家 ID (外鍵) | UNIQUE |
| `level` | INT | 等級 (1-999) | 1 |
| `current_exp` | BIGINT | 當前經驗值 | 0 |
| `required_exp` | BIGINT | 升級所需經驗 | 100 |
| `max_hp` | INT | 最大生命值 | 100 |
| `current_hp` | INT | 當前生命值 | 100 |
| `max_mp` | INT | 最大法力值 | 50 |
| `current_mp` | INT | 當前法力值 | 50 |
| `attack` | INT | 攻擊力 | 10 |
| `defense` | INT | 防禦力 | 5 |
| `speed` | INT | 速度 | 5 |
| `critical_rate` | DECIMAL(5,2) | 暴擊率 (%) | 5.00 |
| `critical_damage` | DECIMAL(5,2) | 暴擊傷害 (%) | 150.00 |
| `dodge_rate` | DECIMAL(5,2) | 閃避率 (%) | 5.00 |
| `cultivation_speed` | DECIMAL(5,2) | 修煉速度倍率 | 1.00 |
| `breakthrough_success_rate` | DECIMAL(5,2) | 突破成功率 (%) | 50.00 |
| `total_battles` | INT | 總戰鬥次數 | 0 |
| `battles_won` | INT | 勝利次數 | 0 |
| `monsters_killed` | INT | 擊殺怪物數 | 0 |
| `updated_at` | TIMESTAMP | 更新時間 | NOW() |

### 自動初始化
- 當玩家註冊時，觸發器會自動建立此記錄

---

## 3️⃣ player_currencies (玩家貨幣表)

玩家的各種遊戲貨幣。

### 欄位說明

| 欄位 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `id` | SERIAL | 貨幣記錄 ID | - |
| `player_id` | INT | 玩家 ID (外鍵) | UNIQUE |
| `spirit_stones` | BIGINT | 靈石 (主要貨幣) | 0 |
| `immortal_jade` | INT | 仙玉 (付費貨幣) | 0 |
| `contribution_points` | INT | 貢獻點 (宗門貨幣) | 0 |
| `honor_points` | INT | 榮譽點 (競技場貨幣) | 0 |
| `total_spirit_stones_earned` | BIGINT | 累計獲得靈石 | 0 |
| `total_spirit_stones_spent` | BIGINT | 累計消費靈石 | 0 |
| `updated_at` | TIMESTAMP | 更新時間 | NOW() |

### 貨幣用途
- **靈石**: 購買物品、裝備、技能書
- **仙玉**: 付費貨幣，購買特殊道具
- **貢獻點**: 宗門兌換稀有物品
- **榮譽點**: 競技場兌換裝備

---

## 4️⃣ player_realms (玩家境界表)

玩家的修煉境界資訊。

### 欄位說明

| 欄位 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `id` | SERIAL | 境界記錄 ID | - |
| `player_id` | INT | 玩家 ID (外鍵) | UNIQUE |
| `current_realm_id` | INT | 當前境界 ID | 1 |
| `current_stage_id` | INT | 當前境界階段 ID | 1 |
| `current_exp` | BIGINT | 境界經驗值 | 0 |
| `breakthrough_attempts` | INT | 突破嘗試次數 | 0 |
| `total_breakthroughs` | INT | 成功突破次數 | 0 |
| `failed_breakthroughs` | INT | 失敗突破次數 | 0 |
| `last_breakthrough_at` | TIMESTAMP | 最後突破時間 | - |
| `created_at` | TIMESTAMP | 建立時間 | NOW() |
| `updated_at` | TIMESTAMP | 更新時間 | NOW() |

---

## 5️⃣ player_settings (玩家設定表)

玩家的遊戲個人化設定。

### 欄位說明

| 欄位 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `id` | SERIAL | 設定 ID | - |
| `player_id` | INT | 玩家 ID (外鍵) | UNIQUE |
| `sound_enabled` | BOOLEAN | 音效開關 | true |
| `music_enabled` | BOOLEAN | 音樂開關 | true |
| `sound_volume` | INT | 音效音量 (0-100) | 80 |
| `music_volume` | INT | 音樂音量 (0-100) | 60 |
| `email_notifications` | BOOLEAN | 郵件通知 | true |
| `battle_notifications` | BOOLEAN | 戰鬥通知 | true |
| `friend_notifications` | BOOLEAN | 好友通知 | true |
| `profile_public` | BOOLEAN | 公開個人資料 | true |
| `show_online_status` | BOOLEAN | 顯示在線狀態 | true |
| `allow_friend_requests` | BOOLEAN | 允許好友請求 | true |
| `language` | VARCHAR(10) | 語言設定 | zh-TW |
| `timezone` | VARCHAR(50) | 時區 | Asia/Taipei |
| `updated_at` | TIMESTAMP | 更新時間 | NOW() |

---

## 6️⃣ player_login_history (登入歷史表)

記錄玩家的登入活動。

### 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | SERIAL | 記錄 ID |
| `player_id` | INT | 玩家 ID (外鍵) |
| `ip_address` | VARCHAR(45) | IP 地址 |
| `user_agent` | TEXT | 瀏覽器資訊 |
| `device_type` | VARCHAR(50) | 設備類型 |
| `login_at` | TIMESTAMP | 登入時間 |
| `logout_at` | TIMESTAMP | 登出時間 |
| `session_duration` | INT | 會話時長 (秒) |
| `login_successful` | BOOLEAN | 登入是否成功 |
| `failure_reason` | TEXT | 失敗原因 |

---

## 🔧 觸發器 (Triggers)

### 自動初始化觸發器

當新玩家註冊時，以下觸發器會自動執行：

1. **create_player_stats** - 自動建立玩家屬性記錄
2. **create_player_currencies** - 自動建立玩家貨幣記錄
3. **create_player_realms** - 自動建立玩家境界記錄
4. **create_player_settings** - 自動建立玩家設定記錄

### 自動更新觸發器

更新資料時自動更新 `updated_at` 欄位：

5. **update_updated_at_column** - 應用於所有有 `updated_at` 的資料表

---

## 📈 資料表關係圖

```
players (1)
  ├─→ player_stats (1) - 一對一
  ├─→ player_currencies (1) - 一對一
  ├─→ player_realms (1) - 一對一
  ├─→ player_settings (1) - 一對一
  └─→ player_login_history (*) - 一對多
```

---

## 🔍 常用查詢範例

### 查詢玩家完整資料

```sql
SELECT
    p.id, p.username, p.display_name, p.email,
    ps.level, ps.current_exp, ps.max_hp, ps.current_hp,
    ps.attack, ps.defense,
    pc.spirit_stones, pc.immortal_jade,
    pr.current_realm_id, pr.current_stage_id,
    pr.total_breakthroughs
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id
LEFT JOIN player_currencies pc ON p.id = pc.player_id
LEFT JOIN player_realms pr ON p.id = pr.player_id
WHERE p.username = 'your_username';
```

### 查詢前 10 名高等級玩家

```sql
SELECT
    p.username, p.display_name,
    ps.level, ps.current_exp,
    pr.total_breakthroughs
FROM players p
JOIN player_stats ps ON p.id = ps.player_id
JOIN player_realms pr ON p.id = pr.player_id
WHERE p.is_active = true AND p.is_banned = false
ORDER BY ps.level DESC, ps.current_exp DESC
LIMIT 10;
```

### 查詢玩家登入統計

```sql
SELECT
    p.username,
    p.login_count,
    p.last_login,
    COUNT(plh.id) as total_sessions
FROM players p
LEFT JOIN player_login_history plh ON p.id = plh.player_id
WHERE p.id = 1
GROUP BY p.id, p.username, p.login_count, p.last_login;
```

---

## 🛠️ 維護指令

### 重建觸發器

```sql
-- 重建所有觸發器
psql -U postgres -d IMMORTAL -f create_player_tables.sql
```

### 清空測試資料

```sql
-- 小心使用! 會刪除所有玩家資料
TRUNCATE TABLE players CASCADE;
```

### 檢查資料表狀態

```sql
-- 查看所有玩家相關資料表
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'player%';
```

---

**資料庫結構說明完成!** 📊
