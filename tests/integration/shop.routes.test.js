/**
 * Shop 路由整合測試（mock DB）
 * 涵蓋購買/出售的交易分支：境界/限購/貨幣不足、出售裝備、數量不足等。
 */
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../../src/config/database", () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
}));

const pool = require("../../src/config/database");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", require("../../src/routes"));
  return app;
}

function makeToken(playerId = 1) {
  return jwt.sign({ playerId, username: "tester" }, process.env.JWT_SECRET);
}

function mockClient() {
  return { query: jest.fn(), release: jest.fn() };
}

let app;
const token = makeToken();
beforeAll(() => { app = buildApp(); });
afterEach(() => { jest.clearAllMocks(); });

describe("POST /api/shop/buy", () => {
  test("未帶 token 回 401", async () => {
    const res = await request(app).post("/api/shop/buy").send({ shopItemId: 1 });
    expect(res.status).toBe(401);
  });

  test("缺少 shopItemId 回 400（驗證失敗）", async () => {
    const res = await request(app)
      .post("/api/shop/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
  });

  test("商品不存在回 404 並 ROLLBACK", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT shop_items 無結果
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post("/api/shop/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ shopItemId: 999 });

    expect(res.status).toBe(404);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
  });

  test("貨幣不足回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{
        id: 1, item_id: 7, item_name: "丹藥", price: "1000",
        currency_type: "spirit_stones", realm_required: null, daily_limit: 0, max_stack: 99,
      }] }) // SELECT shop_items
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "10" }] }) // SELECT currency
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post("/api/shop/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ shopItemId: 1, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("貨幣不足");
  });

  test("成功購買回 200 並 COMMIT", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{
        id: 1, item_id: 7, item_name: "丹藥", price: "100",
        currency_type: "spirit_stones", realm_required: null, daily_limit: 0, max_stack: 99,
      }] }) // SELECT shop_items
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "1000" }] }) // SELECT currency
      .mockResolvedValueOnce({}) // UPDATE currency
      .mockResolvedValueOnce({}) // INSERT inventory
      .mockResolvedValueOnce({ rows: [] }) // questProgress SELECT（無任務）
      .mockResolvedValueOnce({}) // INSERT purchases
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "900" }] }) // SELECT balance
      .mockResolvedValueOnce({}) // INSERT transactions
      .mockResolvedValueOnce({}); // COMMIT

    const res = await request(app)
      .post("/api/shop/buy")
      .set("Authorization", `Bearer ${token}`)
      .send({ shopItemId: 1, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("購買成功");
    expect(res.body.totalCost).toBe("200"); // 100 * 2
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("POST /api/shop/sell", () => {
  test("缺少 inventoryId 回 400（驗證失敗）", async () => {
    const res = await request(app)
      .post("/api/shop/sell")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
  });

  test("找不到物品回 404", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT inventory 無結果
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post("/api/shop/sell")
      .set("Authorization", `Bearer ${token}`)
      .send({ inventoryId: 5 });

    expect(res.status).toBe(404);
  });

  test("裝備中的物品不可出售回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{
        id: 5, item_id: 7, quantity: 1, sell_price: "50",
        item_name: "鐵劍", is_equipped: true, is_tradeable: true,
      }] }) // SELECT inventory
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post("/api/shop/sell")
      .set("Authorization", `Bearer ${token}`)
      .send({ inventoryId: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("請先卸下裝備再出售");
  });

  test("數量不足回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{
        id: 5, item_id: 7, quantity: 2, sell_price: "50",
        item_name: "丹藥", is_equipped: false, is_tradeable: true,
      }] }) // SELECT inventory
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post("/api/shop/sell")
      .set("Authorization", `Bearer ${token}`)
      .send({ inventoryId: 5, quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("物品數量不足");
  });

  test("成功出售回 200 並計算靈石（驗證 inventoryId 欄位正確對應）", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{
        id: 5, item_id: 7, quantity: 3, sell_price: "50",
        item_name: "丹藥", is_equipped: false, is_tradeable: true,
      }] }) // SELECT inventory
      .mockResolvedValueOnce({}) // UPDATE inventory（newQty 2 > 0）
      .mockResolvedValueOnce({}) // UPDATE currency
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "150" }] }) // SELECT balance
      .mockResolvedValueOnce({}) // INSERT transactions
      .mockResolvedValueOnce({}); // COMMIT

    const res = await request(app)
      .post("/api/shop/sell")
      .set("Authorization", `Bearer ${token}`)
      .send({ inventoryId: 5, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("出售成功");
    expect(res.body.spiritStonesGained).toBe("50"); // 50 * 1
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});
