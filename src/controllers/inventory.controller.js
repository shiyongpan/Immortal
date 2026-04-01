const pool = require("../config/database");

class InventoryController {
  /**
   * 獲取玩家背包
   */
  async getInventory(req, res) {
    const playerId = req.user.playerId;
    try {
      const result = await pool.query(
        `SELECT pi.id, pi.quantity, pi.enhancement_level, pi.is_equipped, pi.acquired_at,
                    i.id as item_id, i.item_name, i.description, i.rarity, i.level_required,
                    i.icon_url, i.sell_price, i.effects,
                    it.type_name as item_type,
                    e.slot, e.base_attack, e.base_defense, e.base_hp, e.base_mp, e.base_speed
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 JOIN item_types it ON i.item_type_id = it.id
                 LEFT JOIN equipment e ON i.id = e.item_id
                 WHERE pi.player_id = $1
                 ORDER BY i.rarity DESC, i.item_name`,
        [playerId],
      );
      res.json({ items: result.rows, count: result.rows.length });
    } catch (error) {
      console.error("獲取背包錯誤:", error);
      res.status(500).json({ error: "獲取背包失敗" });
    }
  }

  /**
   * 獲取玩家裝備欄
   */
  async getEquipment(req, res) {
    const playerId = req.user.playerId;
    try {
      const result = await pool.query(
        `SELECT pe.*,
                    w.item_name as weapon_name,
                    h.item_name as helmet_name,
                    a.item_name as armor_name,
                    b.item_name as boots_name,
                    ac1.item_name as accessory_1_name,
                    ac2.item_name as accessory_2_name
                 FROM player_equipment pe
                 LEFT JOIN items w ON pe.weapon_id = w.id
                 LEFT JOIN items h ON pe.helmet_id = h.id
                 LEFT JOIN items a ON pe.armor_id = a.id
                 LEFT JOIN items b ON pe.boots_id = b.id
                 LEFT JOIN items ac1 ON pe.accessory_1_id = ac1.id
                 LEFT JOIN items ac2 ON pe.accessory_2_id = ac2.id
                 WHERE pe.player_id = $1`,
        [playerId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "找不到裝備欄" });
      }
      res.json({ equipment: result.rows[0] });
    } catch (error) {
      console.error("獲取裝備欄錯誤:", error);
      res.status(500).json({ error: "獲取裝備欄失敗" });
    }
  }

  /**
   * 使用物品
   */
  async useItem(req, res) {
    const playerId = req.user.playerId;
    const { itemId, quantity = 1 } = req.body;

    if (!itemId) return res.status(400).json({ error: "請提供物品 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const invResult = await client.query(
        `SELECT pi.*, i.item_type_id, i.effects
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 WHERE pi.player_id = $1 AND pi.item_id = $2`,
        [playerId, itemId],
      );

      if (invResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "背包中找不到該物品" });
      }

      const invItem = invResult.rows[0];

      if (invItem.quantity < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "物品數量不足" });
      }

      const typeResult = await client.query(
        "SELECT type_name FROM item_types WHERE id = $1",
        [invItem.item_type_id],
      );

      if (typeResult.rows[0].type_name !== "consumable") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "此物品無法直接使用" });
      }

      // 應用效果
      const effects = invItem.effects || {};
      const updates = [];
      const values = [playerId];
      let idx = 2;

      if (effects.hp_restore) {
        updates.push(`current_hp = LEAST(current_hp + $${idx++}, max_hp)`);
        values.push(effects.hp_restore * quantity);
      }
      if (effects.mp_restore) {
        updates.push(`current_mp = LEAST(current_mp + $${idx++}, max_mp)`);
        values.push(effects.mp_restore * quantity);
      }
      if (effects.exp_gain) {
        // 境界經驗
        await client.query(
          `UPDATE player_realms SET current_exp = current_exp + $1, updated_at = NOW() WHERE player_id = $2`,
          [effects.exp_gain * quantity, playerId],
        );
      }

      if (updates.length > 0) {
        await client.query(
          `UPDATE player_stats SET ${updates.join(", ")}, updated_at = NOW() WHERE player_id = $1`,
          values,
        );
      }

      // 扣除物品
      const newQty = invItem.quantity - quantity;
      if (newQty > 0) {
        await client.query(
          "UPDATE player_inventory SET quantity = $1 WHERE id = $2",
          [newQty, invItem.id],
        );
      } else {
        await client.query("DELETE FROM player_inventory WHERE id = $1", [invItem.id]);
      }

      await client.query("COMMIT");
      res.json({
        message: "使用成功",
        effects,
        remainingQuantity: newQty,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("使用物品錯誤:", error);
      res.status(500).json({ error: "使用物品失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 裝備物品
   */
  async equipItem(req, res) {
    const playerId = req.user.playerId;
    const { inventoryItemId } = req.body;

    if (!inventoryItemId) return res.status(400).json({ error: "請提供背包物品 ID" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const itemResult = await client.query(
        `SELECT pi.*, e.slot, e.base_attack, e.base_defense, e.base_hp, e.base_mp, e.base_speed
                 FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 JOIN equipment e ON i.id = e.item_id
                 WHERE pi.id = $1 AND pi.player_id = $2`,
        [inventoryItemId, playerId],
      );

      if (itemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "找不到該裝備" });
      }

      const equip = itemResult.rows[0];
      const slotCol = `${equip.slot}_id`;

      // 卸下舊裝備
      const oldEquipResult = await client.query(
        `SELECT ${slotCol} FROM player_equipment WHERE player_id = $1`,
        [playerId],
      );
      const oldItemId = oldEquipResult.rows[0]?.[slotCol];
      if (oldItemId) {
        await client.query(
          `UPDATE player_inventory SET is_equipped = false WHERE player_id = $1 AND item_id = $2`,
          [playerId, oldItemId],
        );
      }

      // 裝備新裝備
      await client.query(
        `UPDATE player_equipment SET ${slotCol} = $1, updated_at = NOW() WHERE player_id = $2`,
        [equip.item_id, playerId],
      );
      await client.query(
        `UPDATE player_inventory SET is_equipped = true WHERE id = $1`,
        [inventoryItemId],
      );

      // 更新屬性
      await client.query(
        `UPDATE player_stats
                 SET attack = attack + $1, defense = defense + $2,
                     max_hp = max_hp + $3, max_mp = max_mp + $4, speed = speed + $5,
                     updated_at = NOW()
                 WHERE player_id = $6`,
        [equip.base_attack, equip.base_defense, equip.base_hp, equip.base_mp, equip.base_speed, playerId],
      );

      await client.query("COMMIT");
      res.json({ message: "裝備成功", slot: equip.slot });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("裝備物品錯誤:", error);
      res.status(500).json({ error: "裝備失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 卸下裝備
   */
  async unequipItem(req, res) {
    const playerId = req.user.playerId;
    const { slot } = req.body;

    const validSlots = ["weapon", "helmet", "armor", "boots", "accessory_1", "accessory_2"];
    if (!slot || !validSlots.includes(slot)) {
      return res.status(400).json({ error: "無效的裝備欄位" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const slotCol = `${slot}_id`;
      const peResult = await client.query(
        `SELECT ${slotCol} FROM player_equipment WHERE player_id = $1`,
        [playerId],
      );

      const itemId = peResult.rows[0]?.[slotCol];
      if (!itemId) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "該裝備欄位為空" });
      }

      // 取得裝備屬性
      const equipResult = await client.query(
        `SELECT e.base_attack, e.base_defense, e.base_hp, e.base_mp, e.base_speed
                 FROM equipment e WHERE e.item_id = $1`,
        [itemId],
      );
      const equip = equipResult.rows[0] || {};

      // 清除欄位
      await client.query(
        `UPDATE player_equipment SET ${slotCol} = NULL, updated_at = NOW() WHERE player_id = $1`,
        [playerId],
      );
      await client.query(
        `UPDATE player_inventory SET is_equipped = false WHERE player_id = $1 AND item_id = $2`,
        [playerId, itemId],
      );

      // 扣除屬性
      await client.query(
        `UPDATE player_stats
                 SET attack = GREATEST(0, attack - $1), defense = GREATEST(0, defense - $2),
                     max_hp = GREATEST(1, max_hp - $3), max_mp = GREATEST(1, max_mp - $4),
                     speed = GREATEST(0, speed - $5), updated_at = NOW()
                 WHERE player_id = $6`,
        [equip.base_attack || 0, equip.base_defense || 0, equip.base_hp || 0,
          equip.base_mp || 0, equip.base_speed || 0, playerId],
      );

      await client.query("COMMIT");
      res.json({ message: "卸下裝備成功", slot });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("卸下裝備錯誤:", error);
      res.status(500).json({ error: "卸下裝備失敗" });
    } finally {
      client.release();
    }
  }

  /**
   * 丟棄物品
   */
  async discardItem(req, res) {
    const playerId = req.user.playerId;
    const { inventoryItemId, quantity } = req.body;

    if (!inventoryItemId) return res.status(400).json({ error: "請提供背包物品 ID" });

    try {
      const invResult = await pool.query(
        `SELECT pi.*, i.is_droppable FROM player_inventory pi
                 JOIN items i ON pi.item_id = i.id
                 WHERE pi.id = $1 AND pi.player_id = $2`,
        [inventoryItemId, playerId],
      );

      if (invResult.rows.length === 0) {
        return res.status(404).json({ error: "找不到該物品" });
      }

      const invItem = invResult.rows[0];

      if (!invItem.is_droppable) {
        return res.status(400).json({ error: "此物品不可丟棄" });
      }
      if (invItem.is_equipped) {
        return res.status(400).json({ error: "請先卸下裝備再丟棄" });
      }

      const dropQty = quantity && quantity < invItem.quantity ? quantity : invItem.quantity;
      const newQty = invItem.quantity - dropQty;

      if (newQty > 0) {
        await pool.query("UPDATE player_inventory SET quantity = $1 WHERE id = $2", [newQty, invItem.id]);
      } else {
        await pool.query("DELETE FROM player_inventory WHERE id = $1", [invItem.id]);
      }

      res.json({ message: "丟棄成功", discarded: dropQty });
    } catch (error) {
      console.error("丟棄物品錯誤:", error);
      res.status(500).json({ error: "丟棄物品失敗" });
    }
  }

  /**
   * 獲取所有物品（供商城/GM用）
   */
  async getAllItems(req, res) {
    const { type, rarity } = req.query;
    try {
      let query = `SELECT i.*, it.type_name, e.slot FROM items i
                     JOIN item_types it ON i.item_type_id = it.id
                     LEFT JOIN equipment e ON i.id = e.item_id WHERE 1=1`;
      const values = [];
      let idx = 1;
      if (type) { query += ` AND it.type_name = $${idx++}`; values.push(type); }
      if (rarity) { query += ` AND i.rarity = $${idx++}`; values.push(rarity); }
      query += " ORDER BY i.rarity DESC, i.item_name";

      const result = await pool.query(query, values);
      res.json({ items: result.rows });
    } catch (error) {
      console.error("獲取物品列表錯誤:", error);
      res.status(500).json({ error: "獲取物品列表失敗" });
    }
  }
}

module.exports = new InventoryController();
