-- 修正：清除錯誤掛到舊 quest ID 的 steps，再以正確 ID 插入新主線任務

-- 1. 刪除錯誤插入的 quest_steps（描述匹配新任務內容）
DELETE FROM quest_steps
WHERE description IN (
  '斬殺金甲犀牛，以其魂魄淬煉金丹',
  '斬殺九尾天狐，從靈核中感悟幻術法則',
  '完成突破，成就元嬰初成',
  '清除幽冥靈蝠巢穴',
  '斬殺千年鬼帥真身',
  '清掃元嬰真龍的前哨蛟龍族群',
  '討伐元嬰真龍，收取龍血',
  '以龍血為引，完成化神突破',
  '以廝殺感悟雷霆法則',
  '領悟空間法則之道',
  '斬殺混元魔祖，揭示幕後真相'
);

-- 2. 插入新主線任務（用不衝突的 ID 24-27）
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

-- 3. 插入任務步驟（引用正確的 quest ID 24-27）
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
(27, 3, '斬殺混元魔祖，揭示幕後真相',               'kill',        57,  1);

-- 4. 插入任務獎勵（引用正確的 quest ID 24-27）
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
LEFT JOIN items i ON i.item_name = v.item_name;

DO $$
BEGIN
    RAISE NOTICE '✅ 修正完成：主線任務 ID 改為 24-27，steps 與 rewards 已正確掛載';
END $$;
