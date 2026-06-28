/**
 * Skill 路由整合測試（mock DB）
 * 涵蓋學習 / 升級 / 技能欄 的主要分支。
 * 注意：skill 路由沒有 Joi validate，欄位檢查在 controller 內。
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

describe("POST /api/skills/learn", () => {
  test("未帶 token 回 401", async () => {
    const res = await request(app).post("/api/skills/learn").send({ skillId: 1 });
    expect(res.status).toBe(401);
  });

  test("缺少 skillId 回 400", async () => {
    const res = await post("/api/skills/learn", {});
    expect(res.status).toBe(400);
  });

  test("技能不存在回 404", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT skills
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/learn", { skillId: 99 });
    expect(res.status).toBe(404);
  });

  test("已學習回 409", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, skill_name: "劍氣", realm_required: null }] }) // SELECT skills
      .mockResolvedValueOnce({ rows: [{ id: 7 }] }) // 已學習
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/learn", { skillId: 1 });
    expect(res.status).toBe(409);
  });

  test("境界不足回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, skill_name: "天劍", realm_required: 3 }] }) // SELECT skills
      .mockResolvedValueOnce({ rows: [] }) // 未學習
      .mockResolvedValueOnce({ rows: [{ realm_order: 1 }] }) // 玩家境界
      .mockResolvedValueOnce({ rows: [{ realm_order: 3 }] }) // 需求境界
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/learn", { skillId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("境界不足，無法學習此技能");
  });

  test("成功學習回 201 並 COMMIT", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, skill_name: "劍氣", realm_required: null }] }) // SELECT skills
      .mockResolvedValueOnce({ rows: [] }) // 未學習
      .mockResolvedValueOnce({}) // INSERT player_skills
      .mockResolvedValueOnce({}); // COMMIT
    const res = await post("/api/skills/learn", { skillId: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ message: "技能學習成功", skillName: "劍氣" });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("POST /api/skills/upgrade", () => {
  test("尚未學習回 404", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT player_skills
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/upgrade", { playerSkillId: 5 });
    expect(res.status).toBe(404);
  });

  test("已達最高等級回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, skill_id: 1, current_level: 5, max_level: 5 }] })
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/upgrade", { playerSkillId: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("技能已達最高等級");
  });

  test("靈石不足回 400", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, skill_id: 1, current_level: 1, max_level: 5 }] })
      .mockResolvedValueOnce({ rows: [{ level_up_cost: 100 }] }) // skill_levels
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "10" }] }) // currency
      .mockResolvedValueOnce({}); // ROLLBACK
    const res = await post("/api/skills/upgrade", { playerSkillId: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("靈石不足");
  });

  test("成功升級並扣除靈石、COMMIT", async () => {
    const client = mockClient();
    pool.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 5, skill_id: 1, current_level: 1, max_level: 5 }] })
      .mockResolvedValueOnce({ rows: [{ level_up_cost: 100 }] }) // skill_levels
      .mockResolvedValueOnce({ rows: [{ spirit_stones: "1000" }] }) // currency
      .mockResolvedValueOnce({}) // UPDATE currency
      .mockResolvedValueOnce({}) // UPDATE player_skills
      .mockResolvedValueOnce({}); // COMMIT
    const res = await post("/api/skills/upgrade", { playerSkillId: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "技能升級成功", newLevel: 2 });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("POST /api/skills/slot", () => {
  test("缺少參數回 400", async () => {
    const res = await post("/api/skills/slot", { skillId: 1 });
    expect(res.status).toBe(400);
  });

  test("欄位索引超出範圍回 400", async () => {
    const res = await post("/api/skills/slot", { skillId: 1, slotIndex: 6 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("技能欄位索引須為 0-5");
  });

  test("skillId 為 null 時清空欄位", async () => {
    pool.query.mockResolvedValueOnce({}); // UPDATE 清除
    const res = await post("/api/skills/slot", { skillId: null, slotIndex: 2 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("技能欄位已清空");
  });

  test("成功設置技能欄", async () => {
    pool.query
      .mockResolvedValueOnce({}) // UPDATE 清除舊
      .mockResolvedValueOnce({}); // UPDATE 設定新
    const res = await post("/api/skills/slot", { skillId: 1, slotIndex: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "技能欄位設置成功", slotIndex: 0 });
  });
});
