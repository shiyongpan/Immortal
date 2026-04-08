const express = require("express");
const router = express.Router();
const questController = require("../controllers/quest.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { startQuestSchema, updateProgressSchema } = require("../validators/quest.validator");

router.use(authenticateToken);

router.get("/available", questController.getAvailableQuests);
router.get("/player", questController.getPlayerQuests);
router.post("/accept", validate(startQuestSchema), questController.acceptQuest);
router.post("/progress", validate(updateProgressSchema), questController.updateProgress);
router.post("/complete", validate(startQuestSchema), questController.completeQuest);
router.post("/abandon", validate(startQuestSchema), questController.abandonQuest);

module.exports = router;
