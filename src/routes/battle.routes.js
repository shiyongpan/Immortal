const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battle.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { startBattleSchema, getBattleLogsSchema } = require("../validators/battle.validator");

router.use(authenticateToken);

router.get("/monsters", battleController.getMonsters);
router.post("/start", validate(startBattleSchema), battleController.startBattle);
router.get("/logs", validate(getBattleLogsSchema, "query"), battleController.getBattleLogs);
router.post("/restore-hp", battleController.restoreHp);

module.exports = router;
