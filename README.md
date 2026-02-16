# 🎮 修仙 RPG 後端 API

一個使用 Node.js + Express + PostgreSQL 開發的修仙主題 RPG 遊戲後端系統。

## ✨ 特色功能

- ✅ RESTful API 架構
- ✅ JWT 身份驗證
- ✅ bcrypt 密碼加密
- ✅ PostgreSQL 資料庫
- ✅ WebSocket 即時通訊
- ✅ 模組化程式碼結構

## 📦 已安裝套件

```json
{
  "express": "^5.2.1",      // Web 框架
  "pg": "^8.18.0",          // PostgreSQL 客戶端
  "ws": "^8.19.0",          // WebSocket
  "bcrypt": "^6.0.0",       // 密碼加密
  "jsonwebtoken": "^9.0.3", // JWT Token
  "dotenv": "^17.3.1",      // 環境變數
  "cors": "^2.8.6"          // 跨域支援
}
```

## 🚀 快速開始

### 1. 環境需求

- Node.js 16+
- PostgreSQL 14+

### 2. 設定環境變數

`.env` 檔案已自動建立,請根據需要修改:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=IMMORTAL
DB_USER=postgres
DB_PASSWORD=IMMORTAL
JWT_SECRET=your_super_secret_key_please_change_this_in_production
```

### 3. 建立資料庫

```bash
# 執行資料庫設定腳本
psql -U postgres -d IMMORTAL -f setup_database.sql
```

### 4. 啟動伺服器

```bash
# 開發模式 (推薦,需要 nodemon)
npm install -g nodemon
npm run dev

# 或一般模式
npm start
```

### 5. 測試 API

伺服器啟動後,訪問:

- **API 首頁**: http://localhost:3000/api
- **健康檢查**: http://localhost:3000/api/health

#### 使用測試腳本

```bash
node test_api.js
```

## 📁 專案結構

```
immortal/
├── src/
│   ├── config/
│   │   └── database.js          # 資料庫連接配置
│   ├── controllers/
│   │   └── auth.controller.js   # 身份驗證控制器
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT 驗證中間件
│   ├── routes/
│   │   ├── auth.routes.js       # 身份驗證路由
│   │   └── index.js             # 路由總匯
│   ├── services/                # 業務邏輯層 (待建立)
│   └── utils/                   # 工具函數 (待建立)
├── .env                         # 環境變數
├── .gitignore                   # Git 忽略檔案
├── server.js                    # 伺服器入口點
├── package.json                 # 專案配置
├── setup_database.sql           # 資料庫設定腳本
├── test_api.js                  # API 測試腳本
├── API_GUIDE.md                 # API 使用指南
├── BackEndRoadMap.md            # 後端開發路線圖
└── README.md                    # 本檔案
```

## 🔌 API 端點

### 身份驗證

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| POST | `/api/auth/register` | 註冊新玩家 | ❌ |
| POST | `/api/auth/login` | 玩家登入 | ❌ |
| GET | `/api/auth/verify` | 驗證 Token | ✅ |
| GET | `/api/auth/me` | 獲取玩家資料 | ✅ |

### 系統

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查 |
| GET | `/api` | API 首頁 |

完整的 API 使用說明請參考 [API_GUIDE.md](./API_GUIDE.md)

## 📝 使用範例

### 註冊新玩家

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "immortal_hero",
    "email": "hero@example.com",
    "password": "secret123",
    "displayName": "修仙者"
  }'
```

### 登入

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "immortal_hero",
    "password": "secret123"
  }'
```

### 獲取玩家資料

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 開發路線圖

根據 [BackEndRoadMap.md](./BackEndRoadMap.md),專案分為 8 個階段:

### ✅ Phase 1: 基礎架構 + 玩家系統 (已完成 70%)
- [x] 專案架構建立
- [x] 資料庫連接
- [x] JWT 身份驗證
- [x] 註冊/登入 API
- [ ] 玩家屬性 CRUD API
- [ ] 玩家貨幣 API

### 🔄 Phase 2: 境界系統 (進行中)
- [ ] 境界突破 API
- [ ] 境界經驗系統
- [ ] 突破歷史記錄

### ⏳ Phase 3-8: 待開發
- Phase 3: 物品與裝備系統
- Phase 4: 技能系統
- Phase 5: 戰鬥系統
- Phase 6: 社交與經濟
- Phase 7: 任務系統
- Phase 8: 優化與測試

## 🔧 開發指南

### 如何添加新的 API 端點?

1. **建立控制器** (`src/controllers/`)
```javascript
// src/controllers/realm.controller.js
class RealmController {
    async breakthrough(req, res) {
        // 實作境界突破邏輯
    }
}
module.exports = new RealmController();
```

2. **建立路由** (`src/routes/`)
```javascript
// src/routes/realm.routes.js
const router = require('express').Router();
const realmController = require('../controllers/realm.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/breakthrough', authenticateToken, realmController.breakthrough);

module.exports = router;
```

3. **註冊路由** (`src/routes/index.js`)
```javascript
const realmRoutes = require('./realm.routes');
router.use('/realm', realmRoutes);
```

## 🛠️ 常用指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 啟動生產伺服器
npm start

# 測試 API
node test_api.js

# 查看日誌
# (開發模式會自動顯示)
```

## 📚 相關文件

- [API_GUIDE.md](./API_GUIDE.md) - API 使用指南
- [BackEndRoadMap.md](./BackEndRoadMap.md) - 完整開發路線圖
- [setup_database.sql](./setup_database.sql) - 資料庫結構

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request!

## 📄 授權

ISC License

---

**開始你的修仙之旅吧!** ⚡️
