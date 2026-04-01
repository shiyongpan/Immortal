require("dotenv").config();
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const pool = require("./src/config/database");
const routes = require("./src/routes");
const { setupWebSocket } = require("./src/websocket/handlers");
const logger = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use((req, res, next) => {
  logger.info(`📩 ${req.method} ${req.path}`);
  next();
});

app.use("/api", routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "找不到該路由", path: req.path });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  logger.error("❌ 伺服器錯誤:", err);
  res.status(500).json({
    error: "伺服器內部錯誤",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 測試資料庫連接
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    logger.error("❌ 資料庫連接失敗:", err.message);
  } else {
    logger.info("✅ 資料庫連接成功:", result.rows[0].now);
  }
});

// 啟動 HTTP 伺服器
const server = app.listen(PORT, () => {
  logger.info(`🚀 HTTP 伺服器運行於: http://localhost:${PORT}`);
  logger.info(`📚 API 根路徑: http://localhost:${PORT}/api`);
  logger.info(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
});

// WebSocket 伺服器（與 HTTP 共享端口）
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);
logger.info("🌐 WebSocket 伺服器已啟動");

// 優雅關閉
process.on("SIGTERM", () => {
  logger.info("📴 收到 SIGTERM，正在關閉...");
  server.close(() => {
    pool.end(() => {
      logger.info("✅ 伺服器已關閉");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  logger.info("📴 收到 SIGINT，正在關閉...");
  server.close(() => {
    pool.end(() => process.exit(0));
  });
});

logger.info("🎮 修仙 RPG 伺服器啟動完成！");
