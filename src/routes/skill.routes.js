const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skill.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

router.get("/available", skillController.getAvailableSkills);
router.get("/player", skillController.getPlayerSkills);
router.post("/learn", skillController.learnSkill);
router.post("/upgrade", skillController.upgradeSkill);
router.post("/slot", skillController.setSkillSlot);

module.exports = router;
