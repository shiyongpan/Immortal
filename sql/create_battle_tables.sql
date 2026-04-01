-- ============================================
-- 修仙 RPG - 戰鬥系統相關資料表
-- ============================================

-- 1. 怪物主表
CREATE TABLE IF NOT EXISTS monsters (
    id SERIAL PRIMARY KEY,
    monster_name VARCHAR(100) NOT NULL,
    description TEXT,
    monster_type VARCHAR(30) DEFAULT 'normal'
        CHECK (monster_type IN ('normal', 'elite', 'boss', 'world_boss')),

    -- 基礎屬性
    level INT DEFAULT 1 CHECK (level >= 1),
    max_hp BIGINT DEFAULT 100 CHECK (max_hp > 0),
    attack INT DEFAULT 10 CHECK (attack >= 0),
    defense INT DEFAULT 5 CHECK (defense >= 0),
    speed INT DEFAULT 5 CHECK (speed >= 0),
    critical_rate DECIMAL(5,2) DEFAULT 5.00,

    -- 獎勵
    exp_reward BIGINT DEFAULT 10 CHECK (exp_reward >= 0),
    spirit_stone_reward INT DEFAULT 0 CHECK (spirit_stone_reward >= 0),

    -- 限制
    realm_required INT REFERENCES realms(id),
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monsters_level ON monsters(level);
CREATE INDEX IF NOT EXISTS idx_monsters_realm ON monsters(realm_required);
COMMENT ON TABLE monsters IS '怪物資料表';

-- 2. 怪物技能表
CREATE TABLE IF NOT EXISTS monster_skills (
    id SERIAL PRIMARY KEY,
    monster_id INT REFERENCES monsters(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    description TEXT,
    damage_multiplier DECIMAL(4,2) DEFAULT 1.00,
    mp_cost INT DEFAULT 0,
    use_chance DECIMAL(5,2) DEFAULT 20.00  -- 每回合觸發機率 %
);

CREATE INDEX IF NOT EXISTS idx_monster_skills_monster ON monster_skills(monster_id);

-- 3. 怪物掉落表
CREATE TABLE IF NOT EXISTS monster_drops (
    id SERIAL PRIMARY KEY,
    monster_id INT REFERENCES monsters(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),
    drop_rate DECIMAL(5,2) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 100),
    min_quantity INT DEFAULT 1 CHECK (min_quantity >= 1),
    max_quantity INT DEFAULT 1 CHECK (max_quantity >= 1)
);

CREATE INDEX IF NOT EXISTS idx_monster_drops_monster ON monster_drops(monster_id);

-- 4. 戰鬥記錄表
CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    monster_id INT REFERENCES monsters(id),
    monster_name VARCHAR(100),

    -- 戰鬥結果
    result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'lose', 'flee')),
    rounds INT DEFAULT 0,
    player_hp_remaining INT DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    damage_taken BIGINT DEFAULT 0,

    -- 獎勵
    exp_gained BIGINT DEFAULT 0,
    spirit_stones_gained INT DEFAULT 0,
    items_dropped JSONB,  -- [{"item_id": 1, "quantity": 2}]

    -- 詳細回合記錄
    battle_detail JSONB,

    fought_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_logs_player ON battle_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_time ON battle_logs(fought_at);
COMMENT ON TABLE battle_logs IS '戰鬥記錄表';

DO $$
BEGIN
    RAISE NOTICE '✅ 戰鬥系統資料表建立完成！';
END $$;
