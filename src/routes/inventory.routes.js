const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// 所有路由需要認證
router.use(authenticateToken);

router.get("/", inventoryController.getInventory);
router.get("/equipment", inventoryController.getEquipment);
router.post("/use", inventoryController.useItem);
router.post("/equip", inventoryController.equipItem);
router.post("/unequip", inventoryController.unequipItem);
router.post("/discard", inventoryController.discardItem);
router.get("/items", inventoryController.getAllItems);

module.exports = router;
