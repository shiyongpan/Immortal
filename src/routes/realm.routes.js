const express = require("express");
const router = express.Router();
const realmController = require("../controllers/realm.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { addExpSchema, breakthroughSchema } = require("../validators/realm.validator");

// 公開路由
router.get("/", realmController.getAllRealms);

// 需要認證
router.get("/player", authenticateToken, realmController.getPlayerRealm);
router.get("/player/history", authenticateToken, realmController.getBreakthroughHistory);
router.get("/player/requirements", authenticateToken, realmController.getBreakthroughRequirements);
router.post("/player/add-exp", authenticateToken, validate(addExpSchema), realmController.addExp);
router.post("/player/breakthrough", authenticateToken, validate(breakthroughSchema), realmController.breakthrough);
router.post("/player/cultivate", authenticateToken, realmController.cultivate);

module.exports = router;
