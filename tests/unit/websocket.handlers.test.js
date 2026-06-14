/**
 * WebSocket 處理層測試
 * 以假的 wss / ws（EventEmitter）驅動，DB 模組 mock，JWT 以測試密鑰真實簽章。
 */
const { EventEmitter } = require("events");
const jwt = require("jsonwebtoken");

jest.mock("../../src/config/database", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require("../../src/config/database");
const { setupWebSocket } = require("../../src/websocket/handlers");

function makeWs() {
  const ws = new EventEmitter();
  ws.readyState = 1; // OPEN
  ws.send = jest.fn();
  return ws;
}

// 取得某個 ws 收到的所有訊息（已解析 JSON）
function received(ws) {
  return ws.send.mock.calls.map((c) => JSON.parse(c[0]));
}

// 取得最後一則訊息
function lastMsg(ws) {
  const all = received(ws);
  return all[all.length - 1];
}

function signToken(playerId, username = "tester") {
  return jwt.sign({ playerId, username }, process.env.JWT_SECRET);
}

// 送訊息並等待 async handler 完成（清空 microtask 佇列）
async function feed(ws, obj) {
  ws.emit("message", JSON.stringify(obj));
  await new Promise((r) => setImmediate(r));
}

const wss = new EventEmitter();
setupWebSocket(wss);

// 開新連線
function connect() {
  const ws = makeWs();
  wss.emit("connection", ws, {});
  return ws;
}

// 完成 AUTH 的連線
async function connectAuthed(playerId, username) {
  const ws = connect();
  await feed(ws, { type: "AUTH", token: signToken(playerId, username) });
  return ws;
}

const openSockets = [];
function track(ws) {
  openSockets.push(ws);
  return ws;
}

afterEach(async () => {
  // 斷線清理 onlinePlayers（模組共享狀態）
  for (const ws of openSockets.splice(0)) {
    ws.readyState = 3;
    ws.emit("close");
  }
  await new Promise((r) => setImmediate(r));
  jest.clearAllMocks();
});

describe("WebSocket 連線與驗證", () => {
  test("連線時送出 WELCOME", () => {
    const ws = track(connect());
    expect(lastMsg(ws)).toMatchObject({ type: "WELCOME" });
  });

  test("訊息非合法 JSON 時回傳格式錯誤", async () => {
    const ws = track(connect());
    ws.emit("message", "not-json{");
    await new Promise((r) => setImmediate(r));
    expect(lastMsg(ws)).toMatchObject({ type: "ERROR", error: "訊息格式錯誤" });
  });

  test("未驗證即發送其他訊息時被擋下", async () => {
    const ws = track(connect());
    await feed(ws, { type: "PING" });
    expect(lastMsg(ws)).toMatchObject({ type: "ERROR", error: "請先進行身份驗證" });
  });

  test("AUTH 未帶 token 回 AUTH_FAILED", async () => {
    const ws = track(connect());
    await feed(ws, { type: "AUTH" });
    expect(lastMsg(ws)).toMatchObject({ type: "AUTH_FAILED" });
  });

  test("AUTH token 無效回 AUTH_FAILED", async () => {
    const ws = track(connect());
    await feed(ws, { type: "AUTH", token: "garbage.token.here" });
    expect(lastMsg(ws)).toMatchObject({ type: "AUTH_FAILED" });
  });

  test("AUTH 有效 token 回 AUTH_SUCCESS 並設定 playerId", async () => {
    const ws = track(connect());
    await feed(ws, { type: "AUTH", token: signToken(42, "張三") });
    expect(lastMsg(ws)).toMatchObject({
      type: "AUTH_SUCCESS",
      playerId: 42,
      username: "張三",
    });
    expect(ws.playerId).toBe(42);
  });
});

describe("已驗證後的訊息處理", () => {
  test("PING 回 PONG", async () => {
    const ws = track(await connectAuthed(1));
    await feed(ws, { type: "PING" });
    expect(lastMsg(ws)).toMatchObject({ type: "PONG" });
  });

  test("GET_ONLINE_COUNT 回傳在線人數", async () => {
    const ws = track(await connectAuthed(1));
    await feed(ws, { type: "GET_ONLINE_COUNT" });
    expect(lastMsg(ws)).toMatchObject({ type: "ONLINE_COUNT", count: 1 });
  });

  test("未知訊息類型回 ERROR", async () => {
    const ws = track(await connectAuthed(1));
    await feed(ws, { type: "NOPE" });
    expect(lastMsg(ws)).toMatchObject({ type: "ERROR" });
    expect(lastMsg(ws).error).toContain("未知訊息類型");
  });

  test("GET_REALM_DATA 由 DB 取得資料並回傳", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, realm_name: "煉氣", stages: [] }] });
    const ws = track(await connectAuthed(1));
    await feed(ws, { type: "GET_REALM_DATA" });
    expect(lastMsg(ws)).toMatchObject({ type: "REALM_DATA" });
    expect(lastMsg(ws).data).toHaveLength(1);
  });
});

describe("廣播行為", () => {
  test("CHAT_MESSAGE 會廣播給其他在線玩家", async () => {
    const a = track(await connectAuthed(1, "甲"));
    const b = track(await connectAuthed(2, "乙"));
    b.send.mockClear();

    await feed(a, { type: "CHAT_MESSAGE", message: "  你好  " });

    const bMsgs = received(b);
    const chat = bMsgs.find((m) => m.type === "CHAT_MESSAGE");
    expect(chat).toBeDefined();
    expect(chat.message).toBe("你好"); // 已 trim
    expect(chat.username).toBe("甲");
  });

  test("空白訊息不廣播", async () => {
    const a = track(await connectAuthed(1, "甲"));
    const b = track(await connectAuthed(2, "乙"));
    b.send.mockClear();

    await feed(a, { type: "CHAT_MESSAGE", message: "   " });

    expect(received(b).some((m) => m.type === "CHAT_MESSAGE")).toBe(false);
  });

  test("斷線時對其他玩家廣播 PLAYER_OFFLINE", async () => {
    const a = track(await connectAuthed(1, "甲"));
    const b = track(await connectAuthed(2, "乙"));
    b.send.mockClear();

    a.readyState = 3;
    a.emit("close");
    await new Promise((r) => setImmediate(r));

    const offline = received(b).find((m) => m.type === "PLAYER_OFFLINE");
    expect(offline).toMatchObject({ playerId: 1 });
  });
});

describe("境界突破 (BREAKTHROUGH)", () => {
  function mockTxClient() {
    return { query: jest.fn(), release: jest.fn() };
  }

  test("修為不足時回 success:false 並 ROLLBACK", async () => {
    const client = mockTxClient();
    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rows: [{
          current_exp: 0, exp_required: 100, is_extreme: false,
          stage_order: 1, realm_order: 1, current_realm_id: 1, current_stage_id: 5,
        }],
      }) // SELECT 玩家境界
      .mockResolvedValueOnce({}); // ROLLBACK

    const ws = track(await connectAuthed(1, "甲"));
    await feed(ws, { type: "BREAKTHROUGH" });

    expect(lastMsg(ws)).toMatchObject({ type: "BREAKTHROUGH_RESULT", success: false, error: "修為不足" });
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  test("普通階段（非極致）修為足夠時突破成功並 COMMIT", async () => {
    const client = mockTxClient();
    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rows: [{
          current_exp: 100, exp_required: 100, is_extreme: false, // 非極致 → successRate 100
          stage_order: 1, realm_order: 1, current_realm_id: 1, current_stage_id: 5,
        }],
      }) // SELECT 玩家境界
      .mockResolvedValueOnce({ rows: [{ id: 6 }] }) // 下一階段存在
      .mockResolvedValueOnce({}) // UPDATE player_realms
      .mockResolvedValueOnce({}) // INSERT history
      .mockResolvedValueOnce({}); // COMMIT

    const ws = track(await connectAuthed(1, "甲"));
    await feed(ws, { type: "BREAKTHROUGH" });

    const result = received(ws).find((m) => m.type === "BREAKTHROUGH_RESULT");
    expect(result).toMatchObject({ success: true });
    // 成功後會額外廣播突破喜訊
    expect(received(ws).some((m) => m.type === "REALM_BREAKTHROUGH")).toBe(true);
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});
