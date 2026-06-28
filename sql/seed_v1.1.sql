-- ============================================
-- 第一期擴充（v1.1）：元嬰境、化神境資料
-- 獨立執行檔，schema 欄位已對齊實際資料庫
-- 主線任務使用 ID 24-27（避免與現有 guild 任務衝突）
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

-- A-3：新增主線任務（ID 24–27）
INSERT INTO quests (id, quest_name, description, quest_type, realm_required, level_required, is_repeatable, repeat_cooldown_hours)
SELECT v.qid, v.qname, v.qdesc, 'main', r.id, v.qlv, false, 0
FROM (VALUES
  (24, '金丹磨礪', '在金丹境的磨礪中積累力量，斬殺試煉妖獸後突破元嬰', 50, '金丹境'),
  (25, '元嬰初啟', '元嬰境修行初始，清除盤踞幽冥之地的靈蝠與鬼帥',     70, '元嬰境'),
  (26, '真龍討伐', '元嬰境終極考驗，討伐元嬰真龍並收取龍血引化神突破', 80, '元嬰境'),
  (27, '化神問道', '踏入化神境，以廝殺問道天地，斬殺混元魔祖揭示真相', 100, '化神境')
) AS v(qid, qname, qdesc, qlv, realm_name)
JOIN realms r ON r.realm_name = v.realm_name
ON CONFLICT (id) DO NOTHING;

-- A-3：任務步驟
INSERT INTO quest_steps (quest_id, step_order, description, step_type, target_id, required_count) VALUES
(24, 1, '斬殺金甲犀牛，以其魂魄淬煉金丹',          'kill',        21, 10),
(24, 2, '斬殺九尾天狐，從靈核中感悟幻術法則',       'kill',        23,  1),
(24, 3, '完成突破，成就元嬰初成',                   'reach_realm',  4,  1),
(25, 1, '清除幽冥靈蝠巢穴',                         'kill',        41, 10),
(25, 2, '斬殺千年鬼帥真身',                         'kill',        45,  3),
(26, 1, '清掃元嬰真龍的前哨蛟龍族群',               'kill',        46,  5),
(26, 2, '討伐元嬰真龍，收取龍血',                   'kill',        47,  1),
(26, 3, '以龍血為引，完成化神突破',                 'reach_realm',  5,  1),
(27, 1, '以廝殺感悟雷霆法則',                       'kill',        55,  3),
(27, 2, '領悟空間法則之道',                         'kill',        56,  2),
(27, 3, '斬殺混元魔祖，揭示幕後真相',               'kill',        57,  1)
ON CONFLICT DO NOTHING;

-- A-3：任務獎勵
INSERT INTO quest_rewards (quest_id, reward_type, reward_value, item_id, item_quantity)
SELECT v.qid, v.rtype, v.rvalue, i.id, v.qty
FROM (VALUES
  (24, 'exp',           150000, NULL,       1),
  (24, 'spirit_stones',  50000, NULL,       1),
  (24, 'item',               0, '破嬰丹',   1),
  (25, 'exp',           500000, NULL,       1),
  (25, 'spirit_stones', 150000, NULL,       1),
  (25, 'item',               0, '天材地寶', 3),
  (25, 'item',               0, '極境靈石', 2),
  (26, 'exp',          2000000, NULL,       1),
  (26, 'spirit_stones', 600000, NULL,       1),
  (26, 'item',               0, '化神丹',   1),
  (26, 'item',               0, '天材地寶', 5),
  (27, 'exp',         10000000, NULL,       1),
  (27, 'spirit_stones',2000000, NULL,       1),
  (27, 'item',               0, '天材地寶', 10),
  (27, 'item',               0, '極境靈石', 10)
) AS v(qid, rtype, rvalue, item_name, qty)
LEFT JOIN items i ON i.item_name = v.item_name
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ 第一期擴充資料插入完成！';
    RAISE NOTICE '   - 新增怪物: 14 隻（元嬰境 ID 41-47 + 化神境 ID 51-57）';
    RAISE NOTICE '   - 新增技能: 10 個（元嬰境 ID 31-35 + 化神境 ID 41-45）';
    RAISE NOTICE '   - 新增主線任務: 4 個（ID 24-27）含步驟與獎勵';
END $$;
