/**
 * Inventory 路由整合測試（mock DB）
 * 涵蓋使用物品 / 裝備 / 卸下 / 丟棄 的主要分支。
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

function post(path, body) {
  return request(app).post(path).set("Authorization", `Bearer ${token}`).send(body);
}

describe("POST /api/inventory/use", () => {
  test("未帶 token 回 401", async () => {
    const res = await request(app).post("/api/inventory/use").send({ inventoryId: 1 });
    expect(res.status).toBe(401);
  });

  test("缺少 inventoryId 回 400（驗證失敗）", async () => {
    const res = await post("/api/inventory/use", {});
    expect(res.status).toBe(400);
  });

  test("背包找不到物品回 404", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT inventory
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/inventory/use", { inventoryId: 99 });
    expect(res.status).toBe(404);
  });

  test("數量不足回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, item_id: 10, quantity: 1, item_type_id: 1, effects: { hp_restore: 50 } }] })
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/inventory/use", { inventoryId: 5, quantity: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("物品數量不足");
  });

  test("突破丹藥不可直接使用回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, item_id: 44, quantity: 1, item_name: "築基丹", item_type_id: 2, effects: {} }] })
      .mockResolvedValueOnce({ rows: [{ type_name: "consumable" }] }) // item_types
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/inventory/use", { inventoryId: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("突破輔助丹");
  });

  test("成功使用回血丹並 COMMIT，剩餘數量正確", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, item_id: 10, quantity: 3, item_type_id: 1, effects: { hp_restore: 50 } }] })
      .mockResolvedValueOnce({ rows: [{ type_name: "consumable" }] }) // item_types
      .mockResolvedValueOnce({}) // UPDATE player_stats
      .mockResolvedValueOnce({}) // UPDATE player_inventory
      .mockResolvedValueOnce({}); // COMMIT
    const res = await post("/api/inventory/use", { inventoryId: 5, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("使用成功");
    expect(res.body.effects).toEqual({ hp_restore: 50 });
    expect(res.body.remainingQuantity).toBe(2);
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("POST /api/inventory/equip", () => {
  test("找不到裝備回 404", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT equipment
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/inventory/equip", { inventoryId: 9 });
    expect(res.status).toBe(404);
  });

  test("成功裝備（空欄位）並 COMMIT", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, item_id: 10, slot: "weapon", base_attack: 10, base_defense: 0, base_hp: 0, base_mp: 0, base_speed: 0 }] })
      .mockResolvedValueOnce({ rows: [{ weapon_id: null }] }) // 舊裝備為空
      .mockResolvedValueOnce({}) // UPDATE player_equipment
      .mockResolvedValueOnce({}) // UPDATE player_inventory
      .mockResolvedValueOnce({}) // UPDATE player_stats
      .mockResolvedValueOnce({}); // COMMIT
    const res = await post("/api/inventory/equip", { inventoryId: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "裝備成功", slot: "weapon" });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("POST /api/inventory/unequip", () => {
  test("未裝備的物品回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT slot 無結果
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/inventory/unequip", { inventoryId: 5 });
    expect(res.status).toBe(400);
  });

  test("成功卸下並 COMMIT", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ slot: "weapon" }] }) // SELECT slot
      .mockResolvedValueOnce({ rows: [{ weapon_id: 10 }] }) // SELECT player_equipment
      .mockResolvedValueOnce({ rows: [{ base_attack: 10, base_defense: 0, base_hp: 0, base_mp: 0, base_speed: 0 }] }) // equipment stats
      .mockResolvedValueOnce({}) // UPDATE player_equipment NULL
      .mockResolvedValueOnce({}) // UPDATE player_inventory
      .mockResolvedValueOnce({}) // UPDATE player_stats
      .mockResolvedValueOnce({}); // COMMIT
    const res = await post("/api/inventory/unequip", { inventoryId: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "卸下裝備成功", slot: "weapon" });
  });
});

describe("POST /api/inventory/discard", () => {
  test("不可丟棄的物品回 400", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, quantity: 1, is_droppable: false, is_equipped: false }] });
    const res = await post("/api/inventory/discard", { inventoryId: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("此物品不可丟棄");
  });

  test("裝備中的物品需先卸下回 400", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, quantity: 1, is_droppable: true, is_equipped: true }] });
    const res = await post("/api/inventory/discard", { inventoryId: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("請先卸下裝備再丟棄");
  });

  test("成功丟棄（部分數量）", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 5, quantity: 3, is_droppable: true, is_equipped: false }] }) // SELECT
      .mockResolvedValueOnce({}); // UPDATE（newQty 2 > 0）
    const res = await post("/api/inventory/discard", { inventoryId: 5, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "丟棄成功", discarded: 1 });
  });
});
