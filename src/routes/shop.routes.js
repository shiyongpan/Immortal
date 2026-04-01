const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { buyItemSchema, sellItemSchema } = require("../validators/shop.validator");

router.get("/", shopController.getShops);
router.get("/:shopId/items", authenticateToken, shopController.getShopItems);
router.post("/buy", authenticateToken, validate(buyItemSchema), shopController.buyItem);
router.post("/sell", authenticateToken, validate(sellItemSchema), shopController.sellItem);
router.get("/transactions", authenticateToken, shopController.getTransactions);

module.exports = router;
