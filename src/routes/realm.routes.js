const express = require("express");
const router = express.Router();
const realmController = require("../controllers/realm.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// 公開路由
router.get("/", realmController.getAllRealms);

// 需要認證
router.get("/player", authenticateToken, realmController.getPlayerRealm);
router.get("/player/history", authenticateToken, realmController.getBreakthroughHistory);
router.get("/player/requirements", authenticateToken, realmController.getBreakthroughRequirements);
router.post("/player/add-exp", authenticateToken, realmController.addExp);
router.post("/player/breakthrough", authenticateToken, realmController.breakthrough);

module.exports = router;
