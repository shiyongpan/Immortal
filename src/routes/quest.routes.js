const express = require("express");
const router = express.Router();
const questController = require("../controllers/quest.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

router.get("/available", questController.getAvailableQuests);
router.get("/player", questController.getPlayerQuests);
router.post("/accept", questController.acceptQuest);
router.post("/progress", questController.updateProgress);
router.post("/complete", questController.completeQuest);
router.post("/abandon", questController.abandonQuest);

module.exports = router;
