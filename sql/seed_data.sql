-- ============================================
-- 修仙 RPG - 初始測試資料
-- ============================================

-- ============================================
-- 1. 物品資料
-- ============================================

-- 消耗品
INSERT INTO items (item_name, item_type_id, description, rarity, level_required, max_stack, buy_price, sell_price, effects) VALUES
('小回血丹',   1, '回復 100 點生命值的基礎丹藥',        'common',    1,  99, 50,   20,   '{"hp_restore": 100}'),
('中回血丹',   1, '回復 300 點生命值的進階丹藥',        'uncommon',  10, 99, 150,  50,   '{"hp_restore": 300}'),
('大回血丹',   1, '回復 800 點生命值的高階丹藥',        'rare',      30, 99, 500,  150,  '{"hp_restore": 800}'),
('小回靈丹',   1, '回復 50 點法力值的基礎丹藥',         'common',    1,  99, 50,   20,   '{"mp_restore": 50}'),
('中回靈丹',   1, '回復 150 點法力值的進階丹藥',        'uncommon',  10, 99, 150,  50,   '{"mp_restore": 150}'),
('大回靈丹',   1, '回復 400 點法力值的高階丹藥',        'rare',      30, 99, 500,  150,  '{"mp_restore": 400}'),
('聚靈丹',     1, '大量增加境界修為的珍貴丹藥',         'rare',      1,  10, 1000, 300,  '{"exp_gain": 500}'),
('築基丹',     1, '煉氣境突破至築基境的必備丹藥',       'epic',      1,  5,  5000, 1500, '{"exp_gain": 2000}'),
('結金丹',     1, '築基境突破至金丹境的必備丹藥',       'epic',      1,  5,  20000,6000, '{"exp_gain": 8000}'),
('破嬰丹',     1, '金丹境突破至元嬰境的傳說丹藥',       'legendary', 1,  3,  80000,25000,'{"exp_gain": 30000}'),
('化神丹',     1, '元嬰境突破至化神境的仙品丹藥',       'legendary', 1,  1,  300000,100000,'{"exp_gain":100000}')
ON CONFLICT DO NOTHING;

-- 裝備
INSERT INTO items (item_name, item_type_id, description, rarity, level_required, max_stack, buy_price, sell_price, is_tradeable) VALUES
-- 武器
('木劍',       2, '最普通的練功木劍',                   'common',    1,  1,  100,  30,  true),
('鐵劍',       2, '煉製精良的鐵劍，鋒利異常',           'common',    5,  1,  500,  150, true),
('玄鐵劍',     2, '以玄鐵鑄造，可斬金截鐵',             'uncommon',  15, 1,  2000, 600, true),
('靈紋劍',     2, '刻有靈紋的法寶品武器',               'rare',      30, 1,  8000, 2500,true),
('天罡劍',     2, '蘊含天罡之氣的極品飛劍',             'epic',      60, 1,  50000,15000,true),
-- 護甲
('布衣',       2, '普通的修士布衣，略有防禦',           'common',    1,  1,  80,   25,  true),
('皮甲',       2, '以妖獸皮革製成的輕甲',               'common',    5,  1,  400,  120, true),
('玄鐵甲',     2, '以玄鐵打造的重型護甲',               'uncommon',  15, 1,  1800, 550, true),
('靈紋甲',     2, '附有防護靈紋的法寶護甲',             'rare',      30, 1,  7000, 2200,true),
-- 頭盔
('布頭巾',     2, '普通修士的頭巾',                     'common',    1,  1,  60,   20,  true),
('玄鐵盔',     2, '玄鐵打造的頭盔，堅固耐用',           'uncommon',  15, 1,  1500, 450, true),
-- 鞋子
('布靴',       2, '普通修士的布靴',                     'common',    1,  1,  60,   20,  true),
('踏雲靴',     2, '可御風行走的靈寶鞋靴',               'rare',      25, 1,  6000, 1800,true),
-- 飾品
('靈石戒指',   2, '鑲嵌靈石的戒指，略微增加修為吸收',   'uncommon',  10, 1,  1200, 360, true),
('護道符',     2, '蘊含護道之力的符篆飾品',             'rare',      20, 1,  5000, 1500,true)
ON CONFLICT DO NOTHING;

-- 材料
INSERT INTO items (item_name, item_type_id, description, rarity, level_required, max_stack, buy_price, sell_price) VALUES
('妖獸皮革',   3, '普通妖獸的皮革，可用於煉製護甲',     'common',    1,  999, 20,   8),
('妖獸骨骼',   3, '妖獸的骨骼，可用於煉製武器',         'common',    1,  999, 30,   10),
('靈石碎片',   3, '蘊含靈氣的石頭碎片',                 'common',    1,  999, 50,   20),
('中品靈石',   3, '品質較高的靈石，蘊含豐富靈氣',       'uncommon',  1,  999, 200,  80),
('上品靈石',   3, '極品靈石，靈氣充沛',                 'rare',      1,  99,  1000, 400),
('妖核（低）', 3, '低階妖獸的核心，蘊含妖力',           'common',    1,  99,  100,  40),
('妖核（中）', 3, '中階妖獸的核心，妖力濃郁',           'uncommon',  1,  99,  500,  200),
('妖核（高）', 3, '高階妖獸的核心，妖力驚人',           'rare',      1,  10,  3000, 1200),
('天材地寶',   3, '極為稀少的天地靈材',                 'epic',      1,  10,  10000,4000),
('極境靈石',   3, '用於極境突破的特殊靈石',             'rare',      1,  99,  2000, 800)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. 裝備詳細屬性
-- ============================================
INSERT INTO equipment (item_id, slot, base_attack, base_defense, base_hp, base_mp, base_speed, critical_rate, critical_damage)
SELECT i.id, e.slot, e.atk, e.def, e.hp, e.mp, e.spd, e.crit, e.crit_dmg
FROM items i
JOIN (VALUES
  ('木劍',     'weapon',    8,  0,  0,   0,  1,  0.5,  0),
  ('鐵劍',     'weapon',    20, 0,  0,   0,  2,  1.0,  5),
  ('玄鐵劍',   'weapon',    45, 0,  0,   0,  3,  2.0,  10),
  ('靈紋劍',   'weapon',    90, 0,  0,   10, 5,  3.0,  15),
  ('天罡劍',   'weapon',    200,0,  0,   30, 8,  5.0,  25),
  ('布衣',     'armor',     0,  3,  20,  5,  0,  0,    0),
  ('皮甲',     'armor',     0,  10, 60,  0,  1,  0,    0),
  ('玄鐵甲',   'armor',     0,  25, 150, 0,  0,  0,    0),
  ('靈紋甲',   'armor',     0,  55, 350, 20, 2,  0,    0),
  ('布頭巾',   'helmet',    0,  2,  15,  8,  0,  0,    0),
  ('玄鐵盔',   'helmet',    0,  18, 100, 0,  0,  0,    0),
  ('布靴',     'boots',     0,  2,  10,  0,  3,  0,    0),
  ('踏雲靴',   'boots',     0,  8,  50,  0,  10, 1.0,  0),
  ('靈石戒指', 'accessory', 5,  3,  30,  30, 0,  0,    0),
  ('護道符',   'accessory', 0,  15, 80,  60, 0,  0,    0)
) AS e(name, slot, atk, def, hp, mp, spd, crit, crit_dmg) ON i.item_name = e.name
ON CONFLICT (item_id) DO NOTHING;

-- ============================================
-- 3. 技能資料
-- ============================================
INSERT INTO skills (id, skill_name, skill_name_en, description, skill_type, mp_cost, cooldown_seconds, effects, realm_required, level_required, max_level) VALUES
-- 通用技能
(1,  '靈氣彈',     'Spirit Orb',        '凝聚靈氣射出，造成攻擊力 120% 的傷害',       'active',  10, 2,  '{"damage_multiplier": 1.2}',                        1, 1,  10),
(2,  '靈氣護盾',   'Spirit Shield',     '形成靈氣護盾，減少 20% 受到的傷害（3回合）', 'active',  15, 8,  '{"damage_reduction": 0.2, "duration": 3}',          1, 5,  10),
(3,  '靈氣風暴',   'Spirit Storm',      '釋放靈氣風暴，造成攻擊力 180% 的範圍傷害',   'active',  25, 12, '{"damage_multiplier": 1.8, "aoe": true}',           1, 10, 10),
(4,  '煉氣天罡',   'Qi Heavenly Force', '天罡之氣加持，攻擊力提升 30%（5回合）',      'active',  30, 20, '{"attack_buff": 0.3, "duration": 5}',               1, 15, 10),
(5,  '極境爆發',   'Extreme Burst',     '極境之力爆發，造成攻擊力 300% 的爆發傷害',   'ultimate',50, 60, '{"damage_multiplier": 3.0, "self_hp_cost": 0.1}',  1, 20, 5),
-- 築基技能
(11, '御劍術',     'Sword Control',     '以神識操控飛劍，造成攻擊力 150% 的穿刺傷害', 'active',  20, 4,  '{"damage_multiplier": 1.5, "pierce": true}',        2, 25, 10),
(12, '靈盾陣',     'Spirit Array',      '布置靈盾陣法，大幅提升防禦（4回合）',        'active',  25, 15, '{"defense_buff": 0.4, "duration": 4}',              2, 30, 10),
(13, '劍氣縱橫',   'Sword Qi',          '劍氣四射，造成攻擊力 200% 的連擊傷害',       'active',  35, 10, '{"damage_multiplier": 2.0, "hits": 3}',             2, 35, 10),
(14, '萬劍歸宗',   'Ten Thousand Swords','萬劍齊發，造成攻擊力 250% 的群體傷害',      'active',  50, 30, '{"damage_multiplier": 2.5, "aoe": true}',           2, 40, 10),
(15, '劍域',       'Sword Domain',      '展開劍域，持續傷害並減速敵人',               'ultimate',80, 90, '{"domain": true, "dot_multiplier": 0.5, "slow": 0.3}', 2, 45, 5),
-- 金丹技能
(21, '金丹神識',   'Core Sense',        '以金丹神識攻敵，無視 30% 防禦',             'active',  30, 5,  '{"damage_multiplier": 1.6, "defense_ignore": 0.3}', 3, 50, 10),
(22, '九天御劍',   'Nine Heaven Sword', '九把飛劍同時攻擊，造成 220% 連擊傷害',      'active',  45, 12, '{"damage_multiplier": 2.2, "hits": 9}',             3, 60, 10),
(23, '金丹天罡',   'Core Force',        '釋放金丹之力，造成 280% 的爆炸傷害',        'active',  60, 20, '{"damage_multiplier": 2.8, "explosive": true}',     3, 70, 10),
(24, '金丹自爆',   'Core Explosion',    '以金丹自爆，對敵人造成 500% 的自殺式傷害',  'ultimate',0,  300,'{"damage_multiplier": 5.0, "self_destruct": true}', 3, 80, 1),
(25, '無上神通',   'Supreme Art',       '金丹極境神通，造成 400% 傷害並回復 HP',     'ultimate',100,120,'{"damage_multiplier": 4.0, "heal_rate": 0.3}',      3, 90, 5),
-- 被動技能（全境界可學）
(101,'鐵身功',     'Iron Body',         '修煉鐵身功，永久提升 HP 上限 10%',          'passive', 0,  0,  '{"max_hp_bonus": 0.1}',                             NULL,1, 5),
(102,'疾風步',     'Wind Step',         '修煉疾風步法，永久提升速度 15%',            'passive', 0,  0,  '{"speed_bonus": 0.15}',                             NULL,1, 5),
(103,'靈感術',     'Spiritual Sense',   '提升靈感，永久增加暴擊率 3%',              'passive', 0,  0,  '{"critical_rate_bonus": 3.0}',                      NULL,1, 5)
ON CONFLICT (id) DO NOTHING;

-- 技能等級費用（以靈氣彈為例，其他技能類似）
INSERT INTO skill_levels (skill_id, level, mp_cost, cooldown_seconds, effects, level_up_cost) VALUES
(1, 1,  10, 2,  '{"damage_multiplier": 1.2}', 0),
(1, 2,  10, 2,  '{"damage_multiplier": 1.35}',100),
(1, 3,  12, 2,  '{"damage_multiplier": 1.5}', 300),
(1, 4,  12, 2,  '{"damage_multiplier": 1.65}',600),
(1, 5,  15, 1,  '{"damage_multiplier": 1.8}', 1000),
(1, 6,  15, 1,  '{"damage_multiplier": 2.0}', 2000),
(1, 7,  18, 1,  '{"damage_multiplier": 2.2}', 3500),
(1, 8,  18, 1,  '{"damage_multiplier": 2.5}', 5000),
(1, 9,  20, 1,  '{"damage_multiplier": 2.8}', 8000),
(1, 10, 20, 1,  '{"damage_multiplier": 3.0}', 12000),
(11, 1, 20, 4,  '{"damage_multiplier": 1.5}', 0),
(11, 2, 20, 4,  '{"damage_multiplier": 1.7}', 500),
(11, 5, 25, 3,  '{"damage_multiplier": 2.0}', 3000),
(11, 10,30, 2,  '{"damage_multiplier": 2.8}', 20000),
(101,1, 0,  0,  '{"max_hp_bonus": 0.10}', 0),
(101,2, 0,  0,  '{"max_hp_bonus": 0.15}', 200),
(101,3, 0,  0,  '{"max_hp_bonus": 0.20}', 600),
(101,4, 0,  0,  '{"max_hp_bonus": 0.25}', 1500),
(101,5, 0,  0,  '{"max_hp_bonus": 0.30}', 4000)
ON CONFLICT (skill_id, level) DO NOTHING;

-- ============================================
-- 4. 怪物資料
-- ============================================
INSERT INTO monsters (id, monster_name, description, monster_type, level, max_hp, attack, defense, speed, critical_rate, exp_reward, spirit_stone_reward, realm_required) VALUES
-- 煉氣境怪物
(1,  '野狼',         '普通的野狼，適合初學者練手',              'normal',    1,  80,   8,   3,  6,  5.0,  50,   5,  1),
(2,  '毒蛇',         '吐毒的毒蛇，小心毒液',                    'normal',    3,  120,  12,  4,  8,  8.0,  80,   8,  1),
(3,  '土熊',         '體型龐大的土熊，防禦力高',                'normal',    5,  200,  15,  10, 4,  3.0,  120,  12, 1),
(4,  '赤焰狐',       '尾巴能噴火的赤焰狐狸',                    'normal',    8,  280,  20,  6,  10, 10.0, 180,  18, 1),
(5,  '銀背猿王',     '一群猿猴的首領，戰力不凡',                'elite',     12, 500,  30,  15, 8,  12.0, 350,  35, 1),
(6,  '煉氣境妖獸王', '煉氣境最強的妖獸首領',                    'boss',      15, 1200, 45,  20, 7,  15.0, 800,  80, 1),
-- 築基境怪物
(11, '黑鐵蟒',       '體長數丈的黑鐵巨蟒',                      'normal',    20, 600,  50,  25, 5,  6.0,  500,  50, 2),
(12, '火焰虎',       '全身燃燒著火焰的妖虎',                    'normal',    25, 900,  70,  30, 9,  10.0, 700,  70, 2),
(13, '玄冰熊',       '吐出玄冰之氣的巨熊',                      'elite',     30, 1800, 100, 50, 6,  12.0, 1200, 120,2),
(14, '築基境守護獸', '守護秘境的強大妖獸',                      'boss',      35, 4000, 150, 80, 8,  18.0, 3000, 300,2),
-- 金丹境怪物
(21, '金甲犀牛',     '金甲覆體，刀槍不入的犀牛',                'normal',    45, 2000, 150, 100,4,  8.0,  2000, 200,3),
(22, '天雷鵬鳥',     '呼風喚雨的鵬鳥，可操控雷霆',              'elite',     55, 5000, 250, 120,12, 15.0, 5000, 500,3),
(23, '九尾天狐',     '擁有九條尾巴的天狐，善用幻術',            'boss',      65, 12000,400, 200,10, 20.0, 12000,1200,3),
-- 特殊/世界BOSS
(31, '遠古骸骨',     '遠古時代的骸骨妖，蘊含強大死氣',          'elite',     50, 8000, 300, 150,6,  12.0, 8000, 800,3),
(32, '混沌異獸',     '混沌之中誕生的異獸，力量無法估量',        'world_boss',80, 50000,800, 400,8,  25.0, 50000,5000,4)
ON CONFLICT (id) DO NOTHING;

-- 怪物技能
INSERT INTO monster_skills (monster_id, skill_name, description, damage_multiplier, mp_cost, use_chance) VALUES
(5,  '猿王怒吼', '怒吼震懾，降低敵人攻擊力',  1.2, 0, 30.0),
(6,  '妖王之威', '散發王者威壓，造成大量傷害', 2.0, 0, 20.0),
(13, '玄冰吐息', '吐出玄冰之氣，造成冰凍效果', 1.8, 0, 25.0),
(14, '守護之怒', '守護獸的全力攻擊',           2.5, 0, 15.0),
(22, '天雷斬',   '召喚天雷劈向敵人',           2.2, 0, 20.0),
(23, '幻術迷魂', '使敵人陷入幻術狀態',         1.5, 0, 35.0),
(23, '九尾燎原', '九條尾巴釋放火焰',           3.0, 0, 10.0),
(32, '混沌之擊', '混沌之力的毀滅性打擊',       4.0, 0, 15.0),
(32, '異獸咆哮', '震碎天地的咆哮',             2.0, 0, 30.0)
ON CONFLICT DO NOTHING;

-- 怪物掉落
INSERT INTO monster_drops (monster_id, item_id, drop_rate, min_quantity, max_quantity)
SELECT m.id, i.id, d.rate, d.min_q, d.max_q
FROM monsters m
JOIN (VALUES
  -- 野狼
  (1,  '妖獸皮革',   60.0, 1, 2),
  (1,  '小回血丹',   20.0, 1, 1),
  -- 毒蛇
  (2,  '妖獸皮革',   50.0, 1, 2),
  (2,  '小回靈丹',   15.0, 1, 1),
  -- 土熊
  (3,  '妖獸骨骼',   55.0, 1, 3),
  (3,  '妖獸皮革',   40.0, 1, 2),
  -- 赤焰狐
  (4,  '妖核（低）', 40.0, 1, 1),
  (4,  '靈石碎片',   50.0, 1, 3),
  -- 銀背猿王
  (5,  '妖核（低）', 70.0, 1, 2),
  (5,  '中回血丹',   30.0, 1, 1),
  (5,  '靈石碎片',   80.0, 2, 5),
  -- 煉氣境妖獸王
  (6,  '妖核（中）', 60.0, 1, 1),
  (6,  '聚靈丹',     25.0, 1, 1),
  (6,  '木劍',       15.0, 1, 1),
  (6,  '中品靈石',   50.0, 1, 3),
  -- 黑鐵蟒
  (11, '妖核（中）', 50.0, 1, 2),
  (11, '中品靈石',   60.0, 2, 4),
  -- 火焰虎
  (12, '妖獸皮革',   70.0, 2, 4),
  (12, '妖核（中）', 45.0, 1, 2),
  (12, '中回血丹',   35.0, 1, 2),
  -- 玄冰熊
  (13, '妖核（中）', 65.0, 2, 3),
  (13, '皮甲',       20.0, 1, 1),
  (13, '中品靈石',   75.0, 3, 6),
  -- 築基境守護獸
  (14, '妖核（高）', 50.0, 1, 2),
  (14, '玄鐵劍',     12.0, 1, 1),
  (14, '玄鐵甲',     12.0, 1, 1),
  (14, '聚靈丹',     40.0, 1, 2),
  (14, '上品靈石',   35.0, 1, 3),
  -- 金甲犀牛
  (21, '妖核（高）', 55.0, 1, 2),
  (21, '上品靈石',   65.0, 2, 5),
  -- 天雷鵬鳥
  (22, '妖核（高）', 60.0, 2, 3),
  (22, '靈紋劍',     8.0,  1, 1),
  (22, '上品靈石',   70.0, 3, 8),
  -- 九尾天狐
  (23, '天材地寶',   30.0, 1, 2),
  (23, '靈紋甲',     10.0, 1, 1),
  (23, '上品靈石',   80.0, 5, 10),
  -- 混沌異獸
  (32, '天材地寶',   60.0, 3, 6),
  (32, '極境靈石',   40.0, 2, 5),
  (32, '天罡劍',     5.0,  1, 1)
) AS d(monster_id, item_name, rate, min_q, max_q) ON m.id = d.monster_id
JOIN items i ON i.item_name = d.item_name
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 商城資料
-- ============================================
INSERT INTO shops (id, shop_name, description, shop_type) VALUES
(1, '雜貨鋪',     '販售各種基礎消耗品的雜貨鋪',       'general'),
(2, '丹藥閣',     '專門販售各種境界突破丹藥',         'realm'),
(3, '武器堂',     '出售精良武器和防具的武器商人',     'general'),
(4, '榮譽兌換所', '使用榮譽點數兌換珍貴物品',         'pvp'),
(5, '宗門商店',   '使用宗門貢獻點兌換特殊材料',       'guild')
ON CONFLICT (id) DO NOTHING;

-- 商城物品
INSERT INTO shop_items (shop_id, item_id, price, currency_type, daily_limit, realm_required)
SELECT p.shop_id, i.id, p.price, p.currency, p.daily_lim, r.id
FROM (VALUES
  -- 雜貨鋪
  (1, '小回血丹',    60,   'spirit_stones',  0, NULL),
  (1, '中回血丹',    180,  'spirit_stones',  0, NULL),
  (1, '大回血丹',    600,  'spirit_stones',  0, NULL),
  (1, '小回靈丹',    60,   'spirit_stones',  0, NULL),
  (1, '中回靈丹',    180,  'spirit_stones',  0, NULL),
  (1, '靈石碎片',    80,   'spirit_stones',  50, NULL),
  (1, '中品靈石',    250,  'spirit_stones',  20, NULL),
  -- 丹藥閣
  (2, '聚靈丹',      1200, 'spirit_stones',  5, NULL),
  (2, '築基丹',      6000, 'spirit_stones',  1, '煉氣境'),
  (2, '結金丹',      25000,'spirit_stones',  1, '築基境'),
  (2, '破嬰丹',      90000,'spirit_stones',  1, '金丹境'),
  -- 武器堂
  (3, '木劍',        120,  'spirit_stones',  0, NULL),
  (3, '鐵劍',        600,  'spirit_stones',  0, NULL),
  (3, '玄鐵劍',      2400, 'spirit_stones',  0, '築基境'),
  (3, '布衣',        100,  'spirit_stones',  0, NULL),
  (3, '皮甲',        480,  'spirit_stones',  0, NULL),
  (3, '玄鐵甲',      2160, 'spirit_stones',  0, '築基境'),
  -- 榮譽兌換所
  (4, '護道符',      800,  'honor_points',   1, NULL),
  (4, '上品靈石',    200,  'honor_points',   10, NULL),
  -- 宗門商店
  (5, '天材地寶',    1500, 'contribution_points', 3, NULL),
  (5, '妖核（高）',  300,  'contribution_points', 10, NULL)
) AS p(shop_id, item_name, price, currency, daily_lim, realm_name)
JOIN shops s ON s.id = p.shop_id
JOIN items i ON i.item_name = p.item_name
LEFT JOIN realms r ON r.realm_name = p.realm_name
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. 任務資料
-- ============================================
INSERT INTO quests (id, quest_name, description, quest_type, realm_required, level_required, is_repeatable, repeat_cooldown_hours) VALUES
-- 主線任務
(1,  '修仙之始',   '你踏入了修仙之路，先擊敗幾隻野狼證明實力',      'main',   NULL, 1,  false, 0),
(2,  '初試鋒芒',   '在森林中獵殺更多妖獸，積累修煉資糧',            'main',   NULL, 5,  false, 0),
(3,  '煉氣圓滿',   '收集材料，準備突破至築基境的關鍵物資',          'main',   1,    10, false, 0),
(4,  '築基之路',   '完成突破，踏入築基境，迎接新的挑戰',            'main',   1,    15, false, 0),
(5,  '金丹凝練',   '積累足夠的力量，追求金丹境的突破',              'main',   2,    30, false, 0),
-- 支線任務
(11, '草藥採集',   '為村中藥師採集靈草材料',                        'side',   NULL, 1,  true,  72),
(12, '保護商隊',   '護送商隊安全通過妖獸出沒的山谷',                'side',   NULL, 5,  true,  48),
(13, '尋找失蹤弟子','搜尋宗門失蹤弟子的下落',                       'side',   1,    10, false, 0),
(14, '妖獸浩劫',   '大量妖獸突然襲擊，消滅指定目標',                'side',   2,    25, false, 0),
-- 每日任務
(21, '每日修煉',   '今日完成修煉目標（擊敗10隻妖獸）',              'daily',  NULL, 1,  true,  24),
(22, '每日采靈',   '今日採集靈石材料',                              'daily',  NULL, 1,  true,  24),
(23, '每日歷練',   '挑戰較強的妖獸，積累戰鬥經驗',                  'daily',  1,    10, true,  24)
ON CONFLICT (id) DO NOTHING;

-- 任務步驟
INSERT INTO quest_steps (quest_id, step_order, description, step_type, target_id, target_name, required_count) VALUES
-- 修仙之始
(1,  1, '擊敗野狼 5 隻',         'kill',    1,  '野狼',    5),
(1,  2, '擊敗毒蛇 3 隻',         'kill',    2,  '毒蛇',    3),
-- 初試鋒芒
(2,  1, '擊敗土熊 3 隻',         'kill',    3,  '土熊',    3),
(2,  2, '擊敗赤焰狐 3 隻',       'kill',    4,  '赤焰狐',  3),
(2,  3, '收集妖獸皮革 10 份',    'collect', 17, '妖獸皮革',10),
-- 煉氣圓滿
(3,  1, '擊敗銀背猿王 1 隻',     'kill',    5,  '銀背猿王',1),
(3,  2, '收集中品靈石 5 顆',     'collect', 20, '中品靈石',5),
(3,  3, '收集聚靈丹 2 顆',       'collect', 7,  '聚靈丹',  2),
-- 築基之路
(4,  1, '擊敗煉氣境妖獸王',      'kill',    6,  '煉氣境妖獸王', 1),
(4,  2, '達到築基境',            'reach_realm', 2, '築基境', 1),
-- 金丹凝練
(5,  1, '擊敗火焰虎 5 隻',       'kill',    12, '火焰虎',  5),
(5,  2, '擊敗玄冰熊 3 隻',       'kill',    13, '玄冰熊',  3),
(5,  3, '收集妖核（高）3 個',    'collect', 25, '妖核（高）', 3),
-- 草藥採集
(11, 1, '收集靈石碎片 20 份',    'collect', 19, '靈石碎片',20),
(11, 2, '收集妖獸皮革 5 份',     'collect', 17, '妖獸皮革',5),
-- 保護商隊
(12, 1, '擊敗野狼 8 隻',         'kill',    1,  '野狼',    8),
(12, 2, '擊敗土熊 3 隻',         'kill',    3,  '土熊',    3),
-- 妖獸浩劫
(14, 1, '擊敗火焰虎 8 隻',       'kill',    12, '火焰虎',  8),
(14, 2, '擊敗玄冰熊 5 隻',       'kill',    13, '玄冰熊',  5),
(14, 3, '擊敗築基境守護獸',      'kill',    14, '築基境守護獸', 1),
-- 每日修煉
(21, 1, '今日擊敗妖獸 10 隻（野狼或毒蛇）', 'kill', 1, '野狼', 10),
-- 每日采靈
(22, 1, '收集靈石碎片 30 份',    'collect', 19, '靈石碎片',30),
-- 每日歷練
(23, 1, '擊敗銀背猿王 2 隻',     'kill',    5,  '銀背猿王',2),
(23, 2, '擊敗赤焰狐 5 隻',       'kill',    4,  '赤焰狐',  5)
ON CONFLICT DO NOTHING;

-- 任務獎勵
INSERT INTO quest_rewards (quest_id, reward_type, reward_value, item_id, item_quantity)
SELECT q.id, r.rtype, r.rvalue, i.id, r.qty
FROM quests q
JOIN (VALUES
  -- 修仙之始
  (1,  'exp',           500,  NULL,        1),
  (1,  'spirit_stones', 200,  NULL,        1),
  (1,  'item',          0,    '小回血丹',  3),
  -- 初試鋒芒
  (2,  'exp',           1500, NULL,        1),
  (2,  'spirit_stones', 500,  NULL,        1),
  (2,  'item',          0,    '靈石碎片',  5),
  -- 煉氣圓滿
  (3,  'exp',           3000, NULL,        1),
  (3,  'spirit_stones', 1000, NULL,        1),
  (3,  'item',          0,    '布衣',      1),
  -- 築基之路
  (4,  'exp',           8000, NULL,        1),
  (4,  'spirit_stones', 3000, NULL,        1),
  (4,  'item',          0,    '鐵劍',      1),
  -- 金丹凝練
  (5,  'exp',           30000,NULL,        1),
  (5,  'spirit_stones', 10000,NULL,        1),
  (5,  'item',          0,    '靈紋劍',   1),
  -- 草藥採集
  (11, 'exp',           300,  NULL,        1),
  (11, 'spirit_stones', 150,  NULL,        1),
  (11, 'item',          0,    '小回血丹',  2),
  -- 保護商隊
  (12, 'exp',           800,  NULL,        1),
  (12, 'spirit_stones', 400,  NULL,        1),
  (12, 'item',          0,    '靈石碎片',  8),
  -- 妖獸浩劫
  (14, 'exp',           15000,NULL,        1),
  (14, 'spirit_stones', 5000, NULL,        1),
  (14, 'honor_points',  50,   NULL,        1),
  -- 每日修煉
  (21, 'exp',           200,  NULL,        1),
  (21, 'spirit_stones', 80,   NULL,        1),
  -- 每日采靈
  (22, 'spirit_stones', 120,  NULL,        1),
  (22, 'item',          0,    '中品靈石',  1),
  -- 每日歷練
  (23, 'exp',           500,  NULL,        1),
  (23, 'spirit_stones', 200,  NULL,        1),
  (23, 'honor_points',  10,   NULL,        1)
) AS r(quest_id, rtype, rvalue, item_name, qty) ON q.id = r.quest_id
LEFT JOIN items i ON i.item_name = r.item_name
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ 測試資料插入完成！';
    RAISE NOTICE '   - 物品: 消耗品 11 種、裝備 15 種、材料 10 種';
    RAISE NOTICE '   - 技能: 18 種（主動/被動/必殺）';
    RAISE NOTICE '   - 怪物: 15 隻（普通/精英/BOSS/世界BOSS）';
    RAISE NOTICE '   - 商城: 5 間、商品 21 種';
    RAISE NOTICE '   - 任務: 13 個（主線/支線/每日）';
END $$;

-- ============================================
-- 第一期擴充（v1.1）：元嬰境、化神境資料
-- ============================================

-- A-1：新增怪物 - 元嬰境（7 隻，ID 41–47）
INSERT INTO monsters (id, name, description, rank, level, max_hp, attack, defense, speed, exp_reward, spirit_stones_reward)
VALUES
  (41, '幽冥靈蝠',   '棲息於幽冥之地的靈蝠，以陰煞之氣為食',         'normal',  70,   4200,  280, 160, 18,  15000,   500),
  (42, '寒冰玄蟒',   '身披玄冰鱗片的巨蟒，吐息帶有冰寒之氣',         'normal',  73,   4800,  295, 200, 10,  18000,   600),
  (43, '焰羽火鳳',   '鳳羽燃燒著業火，展翅遮天的火焰鳳凰',           'normal',  77,   5200,  310, 170, 14,  22000,   750),
  (44, '磐古金剛蠍', '以磐古之力凝結而成的金剛毒蠍，鉗如山嶽',       'normal',  82,   5800,  300, 230,  8,  26000,   900),
  (45, '千年鬼帥',   '修煉千年的強大鬼修，身懷陰冥秘術',             'elite',   88,  12000,  420, 260, 12,  60000,  2500),
  (46, '九頭蛟龍',   '九頭並生的古老蛟龍，每顆頭顱皆蘊含龍威',       'elite',   92,  16000,  460, 300, 10,  90000,  3500),
  (47, '元嬰真龍',   '駐守元嬰秘境的真龍，龍血可引化神突破',         'boss',    95,  35000,  600, 400, 12, 300000, 12000)
ON CONFLICT (id) DO NOTHING;

-- A-1：新增怪物 - 化神境（7 隻，ID 51–57）
INSERT INTO monsters (id, name, description, rank, level, max_hp, attack, defense, speed, exp_reward, spirit_stones_reward)
VALUES
  (51, '天魔幻影',   '化神境外圍遊蕩的天魔分身，虛實難辨',           'normal',  100,  11000,   650, 420, 20,  100000,   3000),
  (52, '雷霆龍鯤',   '身形似龍似鯤，掌控雷霆法則的遠古異獸',         'normal',  108,  12500,   700, 450, 15,  130000,   4000),
  (53, '混沌石像',   '由混沌之力凝固而成的石像，幾乎無法撼動',       'normal',  115,  13500,   680, 520,  7,  160000,   5000),
  (54, '法則侵蝕蟲', '以法則之力為食的蟲族，侵蝕一切術法防禦',       'normal',  120,  14500,   720, 460, 14,  190000,   6000),
  (55, '太古雷鵬',   '上古時期的雷鵬，身長萬里，雷霆法則化作本能',   'elite',   128,  30000,   900, 600, 18,  500000,  18000),
  (56, '虛空魔神',   '從虛空裂縫中降臨的魔神，掌控空間法則',         'elite',   138,  40000,   980, 660, 14,  700000,  25000),
  (57, '混元魔祖',   '修仙世界幕後黑手，混元之力加身的絕世強敵',     'boss',    150, 100000,  1300, 850, 11, 2500000, 100000)
ON CONFLICT (id) DO NOTHING;

-- A-2：新增技能 - 元嬰境（5 個）+ 化神境（5 個），ID 31–35、41–45
INSERT INTO skills (id, skill_name, description, skill_type, mp_cost, cooldown, effects, required_realm_id)
SELECT v.sid, v.sname, v.sdesc, v.stype, v.smp, v.scd, v.seff::jsonb, r.id
FROM (VALUES
  (31, '元嬰出竅', '元嬰出竅遊走虛空，無視部分防禦',               'active',   60,   8, '{"damage_multiplier":2.0,"defense_ignore":0.2}',                                            '元嬰境'),
  (32, '神識化劍', '以神識驅使萬劍連斬，並施沉默效果',             'active',   80,  15, '{"damage_multiplier":2.5,"hits":5,"silence":true}',                                         '元嬰境'),
  (33, '天地大挪移','挪移天地法則，造成傷害並震暈敵人',            'active',  100,  30, '{"damage_multiplier":1.5,"stun":true,"stun_duration":2}',                                   '元嬰境'),
  (34, '毀天滅地', '元嬰極境神通，毀滅性的全域攻擊',               'ultimate', 150, 120, '{"damage_multiplier":4.5,"aoe":true,"defense_ignore":0.5}',                                '元嬰境'),
  (35, '涅槃重生', '瀕死時元嬰自燃涅槃，以 30% HP 重生一次',      'passive',    0,   0, '{"revive":true,"revive_hp_rate":0.3,"revive_cooldown_seconds":600}',                       '元嬰境'),
  (41, '法則之力', '掌握一絲法則之力，穿透半數防禦',               'active',   80,  10, '{"damage_multiplier":2.2,"defense_ignore":0.5}',                                            '化神境'),
  (42, '領域展開', '展開化神領域，全面提升攻守並施以持續傷害',     'ultimate', 200, 180, '{"domain":true,"attack_buff":0.5,"defense_buff":0.5,"dot_multiplier":1.5,"duration":5}',   '化神境'),
  (43, '神魂滅殺', '直擊敵魂，造成真實傷害並施沉默效果',           'active',  120,  25, '{"damage_multiplier":3.0,"true_damage":true,"silence_duration":3}',                         '化神境'),
  (44, '天地同壽', '與天地共存，大幅提升生命上限並持續回復',       'passive',    0,   0, '{"max_hp_bonus":0.5,"hp_regen_rate":0.05}',                                                 '化神境'),
  (45, '逆天改命', '逆轉天道，絕境中以 50% HP 復生並反傷',         'ultimate', 300, 999, '{"revive":true,"revive_hp_rate":0.5,"reflect_damage_multiplier":2.0,"invincible_duration":2}','化神境')
) AS v(sid, sname, sdesc, stype, smp, scd, seff, realm_name)
JOIN realms r ON r.realm_name = v.realm_name
ON CONFLICT (id) DO NOTHING;

-- A-3：新增主線任務（ID 6–9）
INSERT INTO quests (id, quest_name, description, quest_type, realm_required, level_required, is_repeatable, repeat_cooldown_hours)
SELECT v.qid, v.qname, v.qdesc, 'main', r.id, v.qlv, false, 0
FROM (VALUES
  (6, '金丹磨礪', '在金丹境的磨礪中積累力量，斬殺試煉妖獸後突破元嬰', 50, '金丹境'),
  (7, '元嬰初啟', '元嬰境修行初始，清除盤踞幽冥之地的靈蝠與鬼帥',     70, '元嬰境'),
  (8, '真龍討伐', '元嬰境終極考驗，討伐元嬰真龍並收取龍血引化神突破', 80, '元嬰境'),
  (9, '化神問道', '踏入化神境，以廝殺問道天地，斬殺混元魔祖揭示真相', 100, '化神境')
) AS v(qid, qname, qdesc, qlv, realm_name)
JOIN realms r ON r.realm_name = v.realm_name
ON CONFLICT (id) DO NOTHING;

-- A-3：任務步驟
INSERT INTO quest_steps (quest_id, step_order, description, step_type, target_id, required_count) VALUES
-- 金丹磨礪
(6, 1, '斬殺金甲犀牛，以其魂魄淬煉金丹',          'kill',        21, 10),
(6, 2, '斬殺九尾天狐，從靈核中感悟幻術法則',       'kill',        23,  1),
(6, 3, '完成突破，成就元嬰初成',                   'reach_realm',  4,  1),
-- 元嬰初啟
(7, 1, '清除幽冥靈蝠巢穴',                         'kill',        41, 10),
(7, 2, '斬殺千年鬼帥真身',                         'kill',        45,  3),
-- 真龍討伐
(8, 1, '清掃元嬰真龍的前哨蛟龍族群',               'kill',        46,  5),
(8, 2, '討伐元嬰真龍，收取龍血',                   'kill',        47,  1),
(8, 3, '以龍血為引，完成化神突破',                 'reach_realm',  5,  1),
-- 化神問道
(9, 1, '以廝殺感悟雷霆法則',                       'kill',        55,  3),
(9, 2, '領悟空間法則之道',                         'kill',        56,  2),
(9, 3, '斬殺混元魔祖，揭示幕後真相',               'kill',        57,  1)
ON CONFLICT DO NOTHING;

-- A-3：任務獎勵
INSERT INTO quest_rewards (quest_id, reward_type, reward_value, item_id, item_quantity)
SELECT v.qid, v.rtype, v.rvalue, i.id, v.qty
FROM (VALUES
  -- 金丹磨礪
  (6,  'exp',           150000, NULL,       1),
  (6,  'spirit_stones',  50000, NULL,       1),
  (6,  'item',               0, '破嬰丹',   1),
  -- 元嬰初啟
  (7,  'exp',           500000, NULL,       1),
  (7,  'spirit_stones', 150000, NULL,       1),
  (7,  'item',               0, '天材地寶', 3),
  (7,  'item',               0, '極境靈石', 2),
  -- 真龍討伐
  (8,  'exp',          2000000, NULL,       1),
  (8,  'spirit_stones', 600000, NULL,       1),
  (8,  'item',               0, '化神丹',   1),
  (8,  'item',               0, '天材地寶', 5),
  -- 化神問道
  (9,  'exp',         10000000, NULL,       1),
  (9,  'spirit_stones',2000000, NULL,       1),
  (9,  'item',               0, '天材地寶', 10),
  (9,  'item',               0, '極境靈石', 10)
) AS v(qid, rtype, rvalue, item_name, qty)
LEFT JOIN items i ON i.item_name = v.item_name
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ 第一期擴充資料插入完成！';
    RAISE NOTICE '   - 新增怪物: 14 隻（元嬰境 7 隻 + 化神境 7 隻）';
    RAISE NOTICE '   - 新增技能: 10 個（元嬰境 5 個 + 化神境 5 個）';
    RAISE NOTICE '   - 新增任務: 4 個主線（ID 6–9）含步驟與獎勵';
END $$;
