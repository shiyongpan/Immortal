-- 创建境界表
CREATE TABLE IF NOT EXISTS realms (
    id SERIAL PRIMARY KEY,
    realm_name VARCHAR(50) NOT NULL,
    realm_name_en VARCHAR(100) NOT NULL,
    realm_order INTEGER NOT NULL,
    description TEXT,
    max_hp INTEGER NOT NULL,
    max_mp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    spirit INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建境界阶段表
CREATE TABLE IF NOT EXISTS realm_stages (
    id SERIAL PRIMARY KEY,
    realm_id INTEGER REFERENCES realms(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    stage_name_en VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    is_extreme BOOLEAN DEFAULT FALSE,
    exp_required INTEGER NOT NULL,
    stat_multiplier DECIMAL(3,2) NOT NULL,
    stat_bonus JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建突破需求表
CREATE TABLE IF NOT EXISTS breakthrough_requirements (
    id SERIAL PRIMARY KEY,
    realm_id INTEGER REFERENCES realms(id) ON DELETE CASCADE,
    breakthrough_type VARCHAR(50) NOT NULL, -- 'peak_to_next_realm' 或 'peak_to_extreme'
    requirement_type VARCHAR(50) NOT NULL, -- 'material', 'stat', 'quest'
    requirement_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建技能解锁表
CREATE TABLE IF NOT EXISTS skill_unlocks (
    id SERIAL PRIMARY KEY,
    realm_id INTEGER REFERENCES realms(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    is_extreme_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建装备解锁表
CREATE TABLE IF NOT EXISTS equipment_unlocks (
    id SERIAL PRIMARY KEY,
    realm_id INTEGER REFERENCES realms(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    min_level INTEGER NOT NULL,
    is_extreme_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建玩家境界表
CREATE TABLE IF NOT EXISTS player_realms (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    current_realm_id INTEGER REFERENCES realms(id),
    current_stage_id INTEGER REFERENCES realm_stages(id),
    current_exp INTEGER DEFAULT 0,
    breakthrough_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_realm_stages_realm_id ON realm_stages(realm_id);
CREATE INDEX IF NOT EXISTS idx_player_realms_player_id ON player_realms(player_id);
CREATE INDEX IF NOT EXISTS idx_breakthrough_requirements_realm_id ON breakthrough_requirements(realm_id);
