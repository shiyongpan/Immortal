-- ============================================
-- 修仙 RPG - 玩家帳號相關資料表
-- ============================================

-- 1. 玩家主表 (基本資料)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    avatar_url VARCHAR(255),

    -- 帳號狀態
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,

    -- 登入資訊
    last_login TIMESTAMP,
    login_count INT DEFAULT 0,

    -- 時間戳記
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_last_login ON players(last_login);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);

COMMENT ON TABLE players IS '玩家基本資料表';
COMMENT ON COLUMN players.username IS '用戶名 (唯一)';
COMMENT ON COLUMN players.email IS '電子郵件 (唯一)';
COMMENT ON COLUMN players.password_hash IS 'bcrypt 加密後的密碼';
COMMENT ON COLUMN players.display_name IS '顯示名稱';
COMMENT ON COLUMN players.is_banned IS '是否被封禁';

-- ============================================
-- 2. 玩家屬性表 (遊戲數據)
-- ============================================
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 等級相關
    level INT DEFAULT 1 CHECK (level >= 1 AND level <= 999),
    current_exp BIGINT DEFAULT 0 CHECK (current_exp >= 0),
    required_exp BIGINT DEFAULT 100,

    -- 戰鬥屬性
    max_hp INT DEFAULT 100 CHECK (max_hp > 0),
    current_hp INT DEFAULT 100 CHECK (current_hp >= 0),
    max_mp INT DEFAULT 50 CHECK (max_mp > 0),
    current_mp INT DEFAULT 50 CHECK (current_mp >= 0),

    attack INT DEFAULT 10 CHECK (attack >= 0),
    defense INT DEFAULT 5 CHECK (defense >= 0),
    speed INT DEFAULT 5 CHECK (speed >= 0),

    -- 進階屬性
    critical_rate DECIMAL(5,2) DEFAULT 5.00 CHECK (critical_rate >= 0 AND critical_rate <= 100),
    critical_damage DECIMAL(5,2) DEFAULT 150.00 CHECK (critical_damage >= 100),
    dodge_rate DECIMAL(5,2) DEFAULT 5.00 CHECK (dodge_rate >= 0 AND dodge_rate <= 100),

    -- 修煉屬性
    cultivation_speed DECIMAL(5,2) DEFAULT 1.00 CHECK (cultivation_speed > 0),
    breakthrough_success_rate DECIMAL(5,2) DEFAULT 50.00 CHECK (breakthrough_success_rate >= 0 AND breakthrough_success_rate <= 100),

    -- 統計資訊
    total_battles INT DEFAULT 0,
    battles_won INT DEFAULT 0,
    monsters_killed INT DEFAULT 0,

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_level ON player_stats(level);

COMMENT ON TABLE player_stats IS '玩家遊戲屬性表';
COMMENT ON COLUMN player_stats.level IS '玩家等級';
COMMENT ON COLUMN player_stats.current_exp IS '當前經驗值';
COMMENT ON COLUMN player_stats.critical_rate IS '暴擊率 (百分比)';

-- ============================================
-- 3. 玩家貨幣表
-- ============================================
CREATE TABLE IF NOT EXISTS player_currencies (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 各種貨幣
    spirit_stones BIGINT DEFAULT 0 CHECK (spirit_stones >= 0),
    immortal_jade INT DEFAULT 0 CHECK (immortal_jade >= 0),
    contribution_points INT DEFAULT 0 CHECK (contribution_points >= 0),
    honor_points INT DEFAULT 0 CHECK (honor_points >= 0),

    -- 統計
    total_spirit_stones_earned BIGINT DEFAULT 0,
    total_spirit_stones_spent BIGINT DEFAULT 0,

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_currencies_player_id ON player_currencies(player_id);

COMMENT ON TABLE player_currencies IS '玩家貨幣系統';
COMMENT ON COLUMN player_currencies.spirit_stones IS '靈石 (主要貨幣)';
COMMENT ON COLUMN player_currencies.immortal_jade IS '仙玉 (付費貨幣)';
COMMENT ON COLUMN player_currencies.contribution_points IS '貢獻點 (宗門貨幣)';
COMMENT ON COLUMN player_currencies.honor_points IS '榮譽點 (競技場貨幣)';

-- ============================================
-- 4. 玩家境界表
-- ============================================
CREATE TABLE IF NOT EXISTS player_realms (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    current_realm_id INT REFERENCES realms(id),
    current_stage_id INT REFERENCES realm_stages(id),
    current_exp BIGINT DEFAULT 0 CHECK (current_exp >= 0),

    -- 突破統計
    breakthrough_attempts INT DEFAULT 0,
    total_breakthroughs INT DEFAULT 0,
    failed_breakthroughs INT DEFAULT 0,
    last_breakthrough_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_realms_player_id ON player_realms(player_id);

COMMENT ON TABLE player_realms IS '玩家當前境界';

-- ============================================
-- 4b. 玩家境界突破歷史表
-- ============================================
CREATE TABLE IF NOT EXISTS player_realm_history (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    from_stage_id INT REFERENCES realm_stages(id),
    to_stage_id INT REFERENCES realm_stages(id),
    success BOOLEAN NOT NULL,
    is_extreme BOOLEAN DEFAULT FALSE,
    breakthrough_time TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realm_history_player ON player_realm_history(player_id);

COMMENT ON TABLE player_realm_history IS '玩家境界突破歷史記錄';
COMMENT ON COLUMN player_realms.current_realm_id IS '當前境界 ID';
COMMENT ON COLUMN player_realms.current_stage_id IS '當前境界階段 ID';

-- ============================================
-- 5. 玩家設定表 (遊戲設定)
-- ============================================
CREATE TABLE IF NOT EXISTS player_settings (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    -- 遊戲設定
    sound_enabled BOOLEAN DEFAULT true,
    music_enabled BOOLEAN DEFAULT true,
    sound_volume INT DEFAULT 80 CHECK (sound_volume >= 0 AND sound_volume <= 100),
    music_volume INT DEFAULT 60 CHECK (music_volume >= 0 AND music_volume <= 100),

    -- 通知設定
    email_notifications BOOLEAN DEFAULT true,
    battle_notifications BOOLEAN DEFAULT true,
    friend_notifications BOOLEAN DEFAULT true,

    -- 隱私設定
    profile_public BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    allow_friend_requests BOOLEAN DEFAULT true,

    -- 語言與地區
    language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_settings_player_id ON player_settings(player_id);

COMMENT ON TABLE player_settings IS '玩家遊戲設定';

-- ============================================
-- 6. 玩家登入歷史表
-- ============================================
CREATE TABLE IF NOT EXISTS player_login_history (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,

    -- 登入資訊
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),

    -- 登入時間
    login_at TIMESTAMP DEFAULT NOW(),
    logout_at TIMESTAMP,
    session_duration INT, -- 秒數

    -- 狀態
    login_successful BOOLEAN DEFAULT true,
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_history_player_id ON player_login_history(player_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON player_login_history(login_at);

COMMENT ON TABLE player_login_history IS '玩家登入歷史記錄';

-- ============================================
-- 觸發器 (Triggers)
-- ============================================

-- 觸發器 1: 自動創建玩家屬性
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_player_stats ON players;
CREATE TRIGGER trigger_create_player_stats
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_stats();

-- 觸發器 2: 自動創建玩家貨幣記錄
CREATE OR REPLACE FUNCTION create_player_currencies()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_currencies (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_player_currencies ON players;
CREATE TRIGGER trigger_create_player_currencies
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_currencies();

-- 觸發器 3: 自動創建玩家境界記錄 (初始為煉氣境初期)
CREATE OR REPLACE FUNCTION create_player_realms()
RETURNS TRIGGER AS $$
DECLARE
    v_realm_id INT;
    v_stage_id INT;
BEGIN
    SELECT id INTO v_realm_id FROM realms WHERE realm_order = 1 LIMIT 1;
    SELECT id INTO v_stage_id FROM realm_stages WHERE realm_id = v_realm_id AND stage_order = 1 LIMIT 1;
    INSERT INTO player_realms (player_id, current_realm_id, current_stage_id) VALUES (NEW.id, v_realm_id, v_stage_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_player_realms ON players;
CREATE TRIGGER trigger_create_player_realms
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_realms();

-- 觸發器 4: 自動創建玩家設定
CREATE OR REPLACE FUNCTION create_player_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_settings (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_player_settings ON players;
CREATE TRIGGER trigger_create_player_settings
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_settings();

-- 觸發器 5: 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_players_updated_at ON players;
CREATE TRIGGER trigger_update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_player_stats_updated_at ON player_stats;
CREATE TRIGGER trigger_update_player_stats_updated_at
BEFORE UPDATE ON player_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_player_currencies_updated_at ON player_currencies;
CREATE TRIGGER trigger_update_player_currencies_updated_at
BEFORE UPDATE ON player_currencies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 測試資料 (可選)
-- ============================================

-- 插入測試玩家 (密碼: password123)
-- 注意: 這個 hash 是 bcrypt 加密 "password123" 的結果
-- INSERT INTO players (username, email, password_hash, display_name) VALUES
-- ('test_player', 'test@example.com', '$2b$10$YourHashHere', '測試玩家');

-- ============================================
-- 查詢範例
-- ============================================

-- 查詢玩家完整資料
-- SELECT
--     p.id, p.username, p.display_name,
--     ps.level, ps.current_exp, ps.max_hp, ps.current_hp,
--     pc.spirit_stones, pc.immortal_jade,
--     pr.current_realm_id, pr.current_stage_id
-- FROM players p
-- LEFT JOIN player_stats ps ON p.id = ps.player_id
-- LEFT JOIN player_currencies pc ON p.id = pc.player_id
-- LEFT JOIN player_realms pr ON p.id = pr.player_id
-- WHERE p.username = 'test_player';

-- ============================================
-- 完成!
-- ============================================

-- 顯示成功訊息
DO $$
BEGIN
    RAISE NOTICE '✅ 玩家帳號相關資料表建立完成!';
    RAISE NOTICE '📋 已建立的資料表:';
    RAISE NOTICE '   - players (玩家主表)';
    RAISE NOTICE '   - player_stats (玩家屬性)';
    RAISE NOTICE '   - player_currencies (玩家貨幣)';
    RAISE NOTICE '   - player_realms (玩家境界)';
    RAISE NOTICE '   - player_settings (玩家設定)';
    RAISE NOTICE '   - player_login_history (登入歷史)';
    RAISE NOTICE '🔧 已建立 5 個觸發器用於自動初始化資料';
END $$;
