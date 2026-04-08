const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const realmRoutes = require("./realm.routes");
const inventoryRoutes = require("./inventory.routes");
const skillRoutes = require("./skill.routes");
const battleRoutes = require("./battle.routes");
const leaderboardRoutes = require("./leaderboard.routes");
const shopRoutes = require("./shop.routes");
const questRoutes = require("./quest.routes");

// 身份驗證
router.use("/auth", authRoutes);

// 遊戲系統
router.use("/realms", realmRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/skills", skillRoutes);
router.use("/battle", battleRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/shop", shopRoutes);
router.use("/quests", questRoutes);

// 健康檢查
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "伺服器運行正常",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// 根路徑 - API 文檔
router.get("/", (req, res) => {
  res.json({
    message: "歡迎來到修仙 RPG API",
    version: "1.0.0",
    endpoints: {
      auth: {
        "POST /api/auth/register": "玩家註冊",
        "POST /api/auth/login": "玩家登入",
        "GET /api/auth/verify": "驗證 Token",
        "GET /api/auth/me": "獲取玩家資料",
      },
      realms: {
        "GET /api/realms": "獲取所有境界資料",
        "GET /api/realms/player": "獲取玩家當前境界",
        "GET /api/realms/player/history": "獲取突破歷史",
        "GET /api/realms/player/requirements": "獲取突破需求",
        "POST /api/realms/player/add-exp": "增加境界經驗",
        "POST /api/realms/player/breakthrough": "嘗試境界突破",
      },
      inventory: {
        "GET /api/inventory": "獲取背包",
        "GET /api/inventory/equipment": "獲取裝備欄",
        "POST /api/inventory/use": "使用物品",
        "POST /api/inventory/equip": "裝備物品",
        "POST /api/inventory/unequip": "卸下裝備",
        "POST /api/inventory/discard": "丟棄物品",
        "GET /api/inventory/items": "獲取所有物品",
      },
      skills: {
        "GET /api/skills/available": "獲取可學習技能",
        "GET /api/skills/player": "獲取已學技能",
        "POST /api/skills/learn": "學習技能",
        "POST /api/skills/upgrade": "升級技能",
        "POST /api/skills/slot": "設置技能欄",
      },
      battle: {
        "GET /api/battle/monsters": "獲取可挑戰怪物",
        "POST /api/battle/start": "發起戰鬥",
        "GET /api/battle/logs": "獲取戰鬥記錄",
        "POST /api/battle/restore-hp": "回復 HP",
      },
      leaderboard: {
        "GET /api/leaderboard/:type": "獲取排行榜 (realm/level/battle_wins/spirit_stones)",
        "GET /api/leaderboard/:type/me": "獲取玩家自身排名",
      },
      shop: {
        "GET /api/shop": "獲取所有商城",
        "GET /api/shop/:shopId/items": "獲取商城物品",
        "POST /api/shop/buy": "購買物品",
        "POST /api/shop/sell": "出售物品",
        "GET /api/shop/transactions": "獲取交易記錄",
      },
      quests: {
        "GET /api/quests/available": "獲取可接任務",
        "GET /api/quests/player": "獲取玩家任務",
        "POST /api/quests/accept": "接取任務",
        "POST /api/quests/progress": "更新任務進度",
        "POST /api/quests/complete": "完成任務領獎",
        "POST /api/quests/abandon": "放棄任務",
      },
    },
  });
});

module.exports = router;
