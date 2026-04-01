require("dotenv").config();
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const pool = require("./src/config/database");
const routes = require("./src/routes");
const { setupWebSocket } = require("./src/websocket/handlers");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.path}`);
  next();
});

app.use("/api", routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "找不到該路由", path: req.path });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  console.error("❌ 伺服器錯誤:", err);
  res.status(500).json({
    error: "伺服器內部錯誤",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 測試資料庫連接
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ 資料庫連接失敗:", err.message);
  } else {
    console.log("✅ 資料庫連接成功:", result.rows[0].now);
  }
});

// 啟動 HTTP 伺服器
const server = app.listen(PORT, () => {
  console.log(`🚀 HTTP 伺服器運行於: http://localhost:${PORT}`);
  console.log(`📚 API 根路徑: http://localhost:${PORT}/api`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
});

// WebSocket 伺服器（與 HTTP 共享端口）
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);
console.log("🌐 WebSocket 伺服器已啟動");

// 優雅關閉
process.on("SIGTERM", () => {
  console.log("📴 收到 SIGTERM，正在關閉...");
  server.close(() => {
    pool.end(() => {
      console.log("✅ 伺服器已關閉");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("📴 收到 SIGINT，正在關閉...");
  server.close(() => {
    pool.end(() => process.exit(0));
  });
});

console.log("🎮 修仙 RPG 伺服器啟動完成！");
