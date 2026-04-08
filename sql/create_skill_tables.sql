-- ============================================
-- 修仙 RPG - 技能系統相關資料表
-- ============================================

-- 1. 技能主表
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    skill_name_en VARCHAR(100),
    description TEXT,
    skill_type VARCHAR(20) DEFAULT 'active'
        CHECK (skill_type IN ('active', 'passive', 'ultimate')),

    -- 消耗
    mp_cost INT DEFAULT 0 CHECK (mp_cost >= 0),
    cooldown_seconds INT DEFAULT 0 CHECK (cooldown_seconds >= 0),

    -- 效果（JSON）
    -- {"damage_multiplier": 1.5, "heal_rate": 0.2, "buff": {"attack": 10}}
    effects JSONB,

    -- 解鎖條件
    realm_required INT REFERENCES realms(id),
    level_required INT DEFAULT 1,

    max_level INT DEFAULT 10 CHECK (max_level >= 1),
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_realm ON skills(realm_required);
COMMENT ON TABLE skills IS '技能資料表';

-- 2. 技能等級表
CREATE TABLE IF NOT EXISTS skill_levels (
    id SERIAL PRIMARY KEY,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level >= 1),

    mp_cost INT DEFAULT 0,
    cooldown_seconds INT DEFAULT 0,
    effects JSONB,
    level_up_cost BIGINT DEFAULT 0,  -- 靈石升級費用

    UNIQUE(skill_id, level)
);

CREATE INDEX IF NOT EXISTS idx_skill_levels_skill ON skill_levels(skill_id);

-- 3. 玩家技能表
CREATE TABLE IF NOT EXISTS player_skills (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id),
    current_level INT DEFAULT 1 CHECK (current_level >= 1),
    is_equipped BOOLEAN DEFAULT false,  -- 是否放入技能欄
    slot_index INT CHECK (slot_index >= 0 AND slot_index <= 5),  -- 技能欄位置(0-5)

    learned_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,

    UNIQUE(player_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_player_skills_player ON player_skills(player_id);
COMMENT ON TABLE player_skills IS '玩家已學技能';

DO $$
BEGIN
    RAISE NOTICE '✅ 技能系統資料表建立完成！';
END $$;
