import client from "./client";

export const inventoryApi = {
  getAll: () => client.get("/inventory"),
  getEquipment: () => client.get("/inventory/equipment"),
  useItem: (inventoryId) => client.post("/inventory/use", { inventoryId }),
  equipItem: (inventoryId) => client.post("/inventory/equip", { inventoryId }),
  unequipItem: (inventoryId) => client.post("/inventory/unequip", { inventoryId }),
  discardItem: (inventoryId, quantity = 1) => client.post("/inventory/discard", { inventoryId, quantity }),
  getAllItems: () => client.get("/inventory/items"),
};
