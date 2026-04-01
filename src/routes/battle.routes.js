const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battle.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

router.get("/monsters", battleController.getMonsters);
router.post("/start", battleController.startBattle);
router.get("/logs", battleController.getBattleLogs);
router.post("/restore-hp", battleController.restoreHp);

module.exports = router;
