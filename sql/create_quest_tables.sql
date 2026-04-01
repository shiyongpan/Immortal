-- ============================================
-- 修仙 RPG - 任務系統相關資料表
-- ============================================

-- 1. 任務主表
CREATE TABLE IF NOT EXISTS quests (
    id SERIAL PRIMARY KEY,
    quest_name VARCHAR(100) NOT NULL,
    description TEXT,
    quest_type VARCHAR(20) DEFAULT 'main'
        CHECK (quest_type IN ('main', 'side', 'daily', 'weekly', 'realm')),

    -- 需求
    realm_required INT REFERENCES realms(id),
    level_required INT DEFAULT 1,
    prerequisite_quest_id INT REFERENCES quests(id),

    -- 重複性
    is_repeatable BOOLEAN DEFAULT false,
    repeat_cooldown_hours INT DEFAULT 24,

    -- 時間限制
    time_limit_hours INT DEFAULT 0,  -- 0 = 無限制

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type, is_active);

-- 2. 任務步驟表
CREATE TABLE IF NOT EXISTS quest_steps (
    id SERIAL PRIMARY KEY,
    quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    description TEXT NOT NULL,
    step_type VARCHAR(20) NOT NULL
        CHECK (step_type IN ('kill', 'collect', 'reach_realm', 'talk', 'explore')),

    -- 目標
    target_id INT,  -- monster_id / item_id / realm_id 等
    target_name VARCHAR(100),
    required_count INT DEFAULT 1 CHECK (required_count >= 1),

    UNIQUE(quest_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_quest_steps_quest ON quest_steps(quest_id);

-- 3. 任務獎勵表
CREATE TABLE IF NOT EXISTS quest_rewards (
    id SERIAL PRIMARY KEY,
    quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL
        CHECK (reward_type IN ('exp', 'spirit_stones', 'immortal_jade', 'item', 'honor_points')),
    reward_value BIGINT DEFAULT 0,
    item_id INT REFERENCES items(id),
    item_quantity INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_quest_rewards_quest ON quest_rewards(quest_id);

-- 4. 玩家任務進度表
CREATE TABLE IF NOT EXISTS player_quests (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    quest_id INT REFERENCES quests(id),

    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),

    -- 步驟進度（JSON）: {"step_1": 3, "step_2": 0}
    step_progress JSONB DEFAULT '{}',
    current_step INT DEFAULT 1,

    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,

    UNIQUE(player_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_player_quests_player ON player_quests(player_id, status);
COMMENT ON TABLE player_quests IS '玩家任務進度';

DO $$
BEGIN
    RAISE NOTICE '✅ 任務系統資料表建立完成！';
END $$;
