const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboard.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// 排行榜公開
router.get("/:type", leaderboardController.getLeaderboard);
// 玩家自身排名需要認證
router.get("/:type/me", authenticateToken, leaderboardController.getPlayerRank);

module.exports = router;
