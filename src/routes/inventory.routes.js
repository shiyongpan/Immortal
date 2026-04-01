const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { useItemSchema, equipItemSchema, discardItemSchema } = require("../validators/inventory.validator");

// 所有路由需要認證
router.use(authenticateToken);

router.get("/", inventoryController.getInventory);
router.get("/equipment", inventoryController.getEquipment);
router.post("/use", validate(useItemSchema), inventoryController.useItem);
router.post("/equip", validate(equipItemSchema), inventoryController.equipItem);
router.post("/unequip", validate(equipItemSchema), inventoryController.unequipItem);
router.post("/discard", validate(discardItemSchema), inventoryController.discardItem);
router.get("/items", inventoryController.getAllItems);

module.exports = router;
