const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.get("/", shopController.getShops);
router.get("/:shopId/items", authenticateToken, shopController.getShopItems);
router.post("/buy", authenticateToken, shopController.buyItem);
router.post("/sell", authenticateToken, shopController.sellItem);
router.get("/transactions", authenticateToken, shopController.getTransactions);

module.exports = router;
