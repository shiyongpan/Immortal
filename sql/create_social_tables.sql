-- ============================================
-- 修仙 RPG - 社交與經濟相關資料表
-- ============================================

-- 1. 排行榜快取表
CREATE TABLE IF NOT EXISTS leaderboards (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    leaderboard_type VARCHAR(30) NOT NULL
        CHECK (leaderboard_type IN ('realm', 'level', 'battle_wins', 'spirit_stones')),
    score BIGINT DEFAULT 0,
    rank_position INT,
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(player_id, leaderboard_type)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_score ON leaderboards(leaderboard_type, score DESC);
COMMENT ON TABLE leaderboards IS '排行榜快取';

-- 2. 商城表
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(100) NOT NULL,
    description TEXT,
    shop_type VARCHAR(20) DEFAULT 'general'
        CHECK (shop_type IN ('general', 'realm', 'pvp', 'guild')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 商城物品表
CREATE TABLE IF NOT EXISTS shop_items (
    id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),

    -- 價格
    price BIGINT NOT NULL CHECK (price > 0),
    currency_type VARCHAR(20) DEFAULT 'spirit_stones'
        CHECK (currency_type IN ('spirit_stones', 'immortal_jade', 'honor_points', 'contribution_points')),

    -- 限購
    daily_limit INT DEFAULT 0,  -- 0 = 無限制
    total_limit INT DEFAULT 0,  -- 0 = 無限制
    total_sold INT DEFAULT 0,

    -- 需求
    realm_required INT REFERENCES realms(id),
    level_required INT DEFAULT 1,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_items_shop ON shop_items(shop_id, is_active);

-- 4. 玩家每日購買記錄（限購用）
CREATE TABLE IF NOT EXISTS player_shop_purchases (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    shop_item_id INT REFERENCES shop_items(id),
    quantity INT DEFAULT 1,
    total_paid BIGINT,
    purchased_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_player_date ON player_shop_purchases(player_id, purchased_at);

-- 5. 交易記錄表
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL
        CHECK (transaction_type IN ('shop_buy', 'item_sell', 'battle_reward', 'realm_cost', 'other')),
    currency_type VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    balance_after BIGINT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, created_at DESC);
COMMENT ON TABLE transactions IS '貨幣交易記錄';

DO $$
BEGIN
    RAISE NOTICE '✅ 社交與商城資料表建立完成！';
END $$;
