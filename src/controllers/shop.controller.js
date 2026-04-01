const logger = require("../utils/logger");
const pool = require("../config/database");

class ShopController {
  /**
   * 獲取所有商城
   */
  async getShops(req, res) {
    try {
      const result = await pool.query(
        "SELECT * FROM shops WHERE is_active = true ORDER BY shop_type, shop_name",
      );
      res.json({ shops: result.rows });
    } catch (error) {
      logger.error("獲取商城列表錯誤:", error);
      res.status(500).json({ error: "獲取商城列表失敗" });
    }
  }

  /**
   * 獲取商城物品
   */
  async getShopItems(req, res) {
    const playerId = req.user.playerId;
    const { shopId } = req.params;

    try {
      // 獲取玩家境界和等級
      const playerResult = await pool.query(
        `SELECT ps.level, pr.current_realm_id
                 FROM player_stats ps
                 JOIN player_realms pr ON ps.player_id = pr.player_id
                 WHERE ps.player_id = $1`,
        [playerId],
      );

      if (playerResult.rows.length === 0) {
        return res.status(404).json({ error: "找不到玩家資料" });
      }

      const { level, current_realm_id } = playerResult.rows[0];

      const result = await pool.query(
        `SELECT si.*, i.item_name, i.description, i.rarity, i.icon_url,
                    it.type_name as item_type,
                    r.realm_name as realm_required_name,
                    CASE WHEN si.realm_required IS NULL OR si.realm_required <= $2 THEN true ELSE false END as can_buy
                 FROM shop_items si
                 JOIN items i ON si.item_id = i.id
                 JOIN item_types it ON i.item_type_id = it.id
                 LEFT JOIN realms r ON si.realm_required = r.id
                 WHERE si.shop_id = $1 AND si.is_active = true
                 ORDER BY si.realm_required, i.rarity DESC, i.item_name`,
        [shopId, current_realm_id],
      );

      res.json({ items: result.rows });
    } catch (error) {
      logger.error("獲取商城物品錯誤:", error);
      res.status(500).json({ error: "獲取商城物品失敗" });
    }
  }

  /**
   * 購買物品
   */
  async buyItem(req, res) {
    const playerId = req.user.playerId;
    const { shopItemId, quantity = 1 } = req.body;

    if (!shopItemId || quantity < 1) {
      return res.status(400).json({ error: "請提供有效的商品 ID 和數量" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 獲取商品資料
      const shopItemResult = await client.query(
        `SELECT si.*, i.item_name, i.max_stack
                 FROM shop_items si
                 JOIN items i ON si.item_id = i.id
                 WHERE si.id = $1 AND si.is_active = true`,
        [shopItemId],
      );

      if (shopItemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "商品不存在" });
      }

      const shopItem = shopItemResult.rows[0];

      // 檢查境界需求
      if (shopItem.realm_required) {
        const realmResult = await client.query(
          `SELECT r.id FROM player_realms pr
                     JOIN realms r ON pr.current_realm_id = r.id
                     WHERE pr.player_id = $1 AND pr.current_realm_id >= $2`,
          [playerId, shopItem.realm_required],
        );
        if (realmResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "境界不足，無法購買此商品" });
        }
      }

      // 檢查每日限購
      if (shopItem.daily_limit > 0) {
        const today = new Date().toISOString().split("T")[0];
        const purchaseResult = await client.query(
          `SELECT COALESCE(SUM(quantity), 0) as total
                     FROM player_shop_purchases
                     WHERE player_id = $1 AND shop_item_id = $2
                     AND DATE(purchased_at) = $3`,
          [playerId, shopItemId, today],
        );
        const purchasedToday = parseInt(purchaseResult.rows[0].total);
        if (purchasedToday + quantity > shopItem.daily_limit) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "超過每日購買限制",
            dailyLimit: shopItem.daily_limit,
            purchasedToday,
          });
        }
      }

      // 計算總價
      const totalCost = BigInt(shopItem.price) * BigInt(quantity);

      // 扣除貨幣
      const currencyCol = shopItem.currency_type;
      const currResult = await client.query(
        `SELECT ${currencyCol} FROM player_currencies WHERE player_id = $1`,
        [playerId],
      );

      if (BigInt(currResult.rows[0][currencyCol]) < totalCost) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "貨幣不足",
          required: totalCost.toString(),
          currency: currencyCol,
        });
      }

      await client.query(
        `UPDATE player_currencies SET ${currencyCol} = ${currencyCol} - $1, updated_at = NOW() WHERE player_id = $2`,
        [totalCost.toString(), playerId],
      );

      // 加入背包
      await client.query(
        `INSERT INTO player_inventory (player_id, item_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (player_id, item_id)
                 DO UPDATE SET quantity = player_inventory.quantity + EXCLUDED.quantity`,
        [playerId, shopItem.item_id, quantity],
      );

      // 記錄購買
      await client.query(
        `INSERT INTO player_shop_purchases (player_id, shop_item_id, quantity, total_paid)
                 VALUES ($1, $2, $3, $4)`,
        [playerId, shopItemId, quantity, totalCost.toString()],
      );

      // 記錄交易
      const balanceResult = await client.query(
        `SELECT ${currencyCol} FROM player_currencies WHERE player_id = $1`,
        [playerId],
      );
      await client.query(
        `INSERT INTO transactions (player_id, transaction_type, currency_type, amount, balance_after, description)
                 VALUES ($1, 'shop_buy', $2, $3, $4, $5)`,
        [
          playerId, currencyCol, (-totalCost).toString(),
          balanceResult.rows[0][currencyCol].toString(),
          `購買 ${shopItem.item_name} x${quantity}`,
        ],
      );

      await client.query("COMMIT");
      res.json({
        message: "購買成功",
        itemName: shopItem.item_name,
        quantity,
        totalCost: totalCost.toString(),
        currency: currencyCol,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("購買物品錯誤:", error);
      res.status(500).json({ error: "購買失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 出售物品（賣給系統）
   */
  async sellItem(req, res) {
    const playerId = req.user.playerId;
    const { inventoryItemId, quantity = 1 } = req.body;

    if (!inventoryItemId) return res.status(400).json({ error: "請提供背包物品 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const invResult = await client.query(
        `SELECT pi.*, i.sell_price, i.item_name, i.is_tradeable
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 WHERE pi.id = $1 AND pi.player_id = $2`,
        [inventoryItemId, playerId],
      );

      if (invResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到該物品" });
      }

      const invItem = invResult.rows[0];

      if (invItem.is_equipped) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "請先卸下裝備再出售" });
      }

      if (invItem.quantity < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "物品數量不足" });
      }

      const totalGain = BigInt(invItem.sell_price) * BigInt(quantity);

      // 扣除物品
      const newQty = invItem.quantity - quantity;
      if (newQty > 0) {
        await client.query("UPDATE player_inventory SET quantity = $1 WHERE id = $2", [newQty, invItem.id]);
      } else {
        await client.query("DELETE FROM player_inventory WHERE id = $1", [invItem.id]);
      }

      // 增加靈石
      await client.query(
        `UPDATE player_currencies SET spirit_stones = spirit_stones + $1, updated_at = NOW() WHERE player_id = $2`,
        [totalGain.toString(), playerId],
      );

      // 記錄交易
      const balanceResult = await client.query(
        "SELECT spirit_stones FROM player_currencies WHERE player_id = $1",
        [playerId],
      );
      await client.query(
        `INSERT INTO transactions (player_id, transaction_type, currency_type, amount, balance_after, description)
                 VALUES ($1, 'item_sell', 'spirit_stones', $2, $3, $4)`,
        [playerId, totalGain.toString(), balanceResult.rows[0].spirit_stones.toString(),
          `出售 ${invItem.item_name} x${quantity}`],
      );

      await client.query("COMMIT");
      res.json({
        message: "出售成功",
        itemName: invItem.item_name,
        quantity,
        spiritStonesGained: totalGain.toString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("出售物品錯誤:", error);
      res.status(500).json({ error: "出售失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 獲取交易記錄
   */
  async getTransactions(req, res) {
    const playerId = req.user.playerId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    try {
      const result = await pool.query(
        `SELECT * FROM transactions WHERE player_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [playerId, limit],
      );
      res.json({ transactions: result.rows });
    } catch (error) {
      logger.error("獲取交易記錄錯誤:", error);
      res.status(500).json({ error: "獲取交易記錄失敗" });
    }
  }
}

module.exports = new ShopController();
