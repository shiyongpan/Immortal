import client from "./client";

export const shopApi = {
  getShops: () => client.get("/shop"),
  getItems: (shopId) => client.get(`/shop/${shopId}/items`),
  buy: (shopItemId, quantity = 1) => client.post("/shop/buy", { shopItemId, quantity }),
  sell: (inventoryId, quantity = 1) => client.post("/shop/sell", { inventoryId, quantity }),
  getTransactions: () => client.get("/shop/transactions"),
};
