-- ============================================
-- 修仙 RPG - 物品與裝備相關資料表
-- ============================================

-- 1. 物品類型表
CREATE TABLE IF NOT EXISTS item_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO item_types (type_name, description) VALUES
('consumable', '消耗品'),
('equipment', '裝備'),
('material', '材料'),
('quest', '任務物品'),
('special', '特殊物品')
ON CONFLICT (type_name) DO NOTHING;

-- 2. 物品主表
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_type_id INT REFERENCES item_types(id),
    description TEXT,
    icon_url VARCHAR(255),

    rarity VARCHAR(20) DEFAULT 'common'
        CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    level_required INT DEFAULT 1 CHECK (level_required >= 1),
    max_stack INT DEFAULT 99 CHECK (max_stack >= 1),
    is_tradeable BOOLEAN DEFAULT true,
    is_droppable BOOLEAN DEFAULT true,

    buy_price BIGINT DEFAULT 0 CHECK (buy_price >= 0),
    sell_price BIGINT DEFAULT 0 CHECK (sell_price >= 0),

    -- 效果（JSON）: {"hp_restore": 100, "mp_restore": 50} 或 {"attack": 10}
    effects JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type_id);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
COMMENT ON TABLE items IS '物品資料表';

-- 3. 裝備詳細表
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    item_id INT UNIQUE REFERENCES items(id) ON DELETE CASCADE,

    slot VARCHAR(20) NOT NULL
        CHECK (slot IN ('weapon', 'helmet', 'armor', 'boots', 'accessory')),

    base_attack INT DEFAULT 0,
    base_defense INT DEFAULT 0,
    base_hp INT DEFAULT 0,
    base_mp INT DEFAULT 0,
    base_speed INT DEFAULT 0,
    critical_rate DECIMAL(5,2) DEFAULT 0,
    critical_damage DECIMAL(5,2) DEFAULT 0,

    max_enhancement_level INT DEFAULT 10,
    enhancement_success_rate DECIMAL(5,2) DEFAULT 80.00,

    set_id INT,
    set_bonus JSONB
);

COMMENT ON TABLE equipment IS '裝備詳細屬性表';

-- 4. 玩家背包表
CREATE TABLE IF NOT EXISTS player_inventory (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),
    quantity INT DEFAULT 1 CHECK (quantity >= 0),

    enhancement_level INT DEFAULT 0 CHECK (enhancement_level >= 0),
    is_equipped BOOLEAN DEFAULT false,

    acquired_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_player_item UNIQUE(player_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON player_inventory(player_id, is_equipped);
COMMENT ON TABLE player_inventory IS '玩家背包';

-- 5. 玩家裝備欄表
CREATE TABLE IF NOT EXISTS player_equipment (
    id SERIAL PRIMARY KEY,
    player_id INT UNIQUE REFERENCES players(id) ON DELETE CASCADE,

    weapon_id INT REFERENCES items(id),
    helmet_id INT REFERENCES items(id),
    armor_id INT REFERENCES items(id),
    boots_id INT REFERENCES items(id),
    accessory_1_id INT REFERENCES items(id),
    accessory_2_id INT REFERENCES items(id),

    updated_at TIMESTAMP DEFAULT NOW()
);

-- 自動創建裝備欄觸發器
CREATE OR REPLACE FUNCTION create_player_equipment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_equipment (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_player_equipment ON players;
CREATE TRIGGER trigger_create_player_equipment
AFTER INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION create_player_equipment();

COMMENT ON TABLE player_equipment IS '玩家當前裝備欄';

DO $$
BEGIN
    RAISE NOTICE '✅ 物品與裝備資料表建立完成！';
END $$;
