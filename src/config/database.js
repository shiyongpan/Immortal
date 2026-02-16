const { Pool } = require("pg");
require("dotenv").config();

// PostgreSQL 連接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 測試資料庫連接
pool.on("connect", () => {
  console.log("✅ 資料庫連接池建立成功");
});

pool.on("error", (err) => {
  console.error("❌ 資料庫連接錯誤:", err);
  process.exit(-1);
});

module.exports = pool;
