const express = require("express");
const WebSocket = require("ws");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

// PostgreSQL 連接池
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "IMMORTAL",
  password: "IMMORTAL",
  port: 5432,
});

// 測試資料庫連接
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ 資料庫連接失敗:", err);
  } else {
    console.log("✅ 資料庫連接成功:", res.rows[0].now);
  }
});

// HTTP 伺服器
const server = app.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}}}`);
});

// WebSocket 伺服器
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("✅ 新玩家連接");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📩 收到訊息:", data);

      // 處理不同類型的請求
      switch (data.type) {
        case "GET_REALM_DATA":
          await handleGetRealmData(ws, data);
          break;
        case "GET_PLAYER_REALM":
          await handleGetPlayerRealm(ws, data);
          break;
        case "BREAKTHROUGH":
          await handleBreakthrough(ws, data);
          break;
        default:
          ws.send(JSON.stringify({ error: "未知的請求類型" }));
      }
    } catch (error) {
      console.error("❌ 處理訊息錯誤:", error);
      ws.send(JSON.stringify({ error: "伺服器錯誤" }));
    }
  });

  ws.on("close", () => {
    console.log("❌ 玩家斷線");
  });
});

// 獲取所有境界資料
async function handleGetRealmData(ws, data) {
  const result = await pool.query(`
        SELECT r.*, rs.*
        FROM realms r
        JOIN realm_stages rs ON r.id = rs.realm_id
        ORDER BY r.realm_order, rs.stage_order
    `);

  ws.send(
    JSON.stringify({
      type: "REALM_DATA",
      data: result.rows,
    }),
  );
}

// 獲取玩家當前境界
async function handleGetPlayerRealm(ws, data) {
  const { playerId } = data;

  const result = await pool.query(
    `
        SELECT pr.*, r.realm_name, rs.stage_name
        FROM player_realms pr
        JOIN realms r ON pr.current_realm_id = r.id
        JOIN realm_stages rs ON pr.current_stage_id = rs.id
        WHERE pr.player_id = $1
    `,
    [playerId],
  );

  ws.send(
    JSON.stringify({
      type: "PLAYER_REALM",
      data: result.rows[0],
    }),
  );
}

// 處理境界突破
async function handleBreakthrough(ws, data) {
  const { playerId } = data;

  // 這裡實作突破邏輯
  // 1. 檢查經驗值是否足夠
  // 2. 檢查是否有突破道具
  // 3. 極境突破有機率失敗
  // 4. 更新玩家境界

  ws.send(
    JSON.stringify({
      type: "BREAKTHROUGH_RESULT",
      success: true,
      message: "突破成功！",
    }),
  );
}

console.log("🎮 遊戲伺服器啟動完成");
