/**
 * Auth 路由整合測試
 * 需要真實資料庫連接，或使用 mock
 */
const request = require("supertest");
const express = require("express");

// Mock 資料庫
jest.mock("../../src/config/database", () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
}));

const pool = require("../../src/config/database");

// 建立測試用 app（不啟動 WebSocket）
function buildApp() {
  const app = express();
  app.use(express.json());
  const routes = require("../../src/routes");
  app.use("/api", routes);
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

let app;
beforeAll(() => { app = buildApp(); });
afterEach(() => { jest.clearAllMocks(); });

describe("POST /api/auth/register", () => {
  test("缺少必填欄位時回傳 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "ab" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("輸入驗證失敗");
  });

  test("email 格式錯誤時回傳 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "hero123",
      email: "not-email",
      password: "secret123",
    });
    expect(res.status).toBe(400);
  });

  test("用戶名已存在時回傳 409", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // 已存在

    const res = await request(app).post("/api/auth/register").send({
      username: "hero123",
      email: "hero@example.com",
      password: "secret123",
    });
    expect(res.status).toBe(409);
  });

  test("成功註冊回傳 201 含 token", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // 用戶名不存在
      .mockResolvedValueOnce({             // INSERT 成功
        rows: [{ id: 1, username: "hero123", email: "hero@example.com", display_name: "hero123", created_at: new Date() }],
      });

    const res = await request(app).post("/api/auth/register").send({
      username: "hero123",
      email: "hero@example.com",
      password: "secret123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.player.username).toBe("hero123");
  });
});

describe("POST /api/auth/login", () => {
  test("缺少 login 或 password 時回傳 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ login: "hero123" });
    expect(res.status).toBe(400);
  });

  test("用戶不存在時回傳 401", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // 找不到用戶

    const res = await request(app).post("/api/auth/login").send({
      login: "nobody",
      password: "secret123",
    });
    expect(res.status).toBe(401);
  });

  test("帳號被封禁時回傳 403", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: "banned", email: "b@b.com", password_hash: "hash", is_banned: true, is_active: true, display_name: "banned" }],
    });

    const res = await request(app).post("/api/auth/login").send({
      login: "banned",
      password: "secret123",
    });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/health", () => {
  test("健康檢查回傳 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});
