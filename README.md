# 🎮 修仙 RPG 後端 API

一個使用 Node.js + Express 5 + PostgreSQL 開發的修仙主題 RPG 遊戲系統。後端提供 RESTful API 與 WebSocket 即時通訊,前端為獨立的 React SPA(位於 `frontend/`)。

## ✨ 功能總覽

- ✅ RESTful API 架構（Express 5）
- ✅ JWT 身份驗證 + bcrypt 密碼加密
- ✅ Joi 輸入驗證中間件
- ✅ PostgreSQL 資料庫（`pg` 連接池 + 交易處理）
- ✅ WebSocket 即時通訊（在線人數、世界聊天、即時突破）
- ✅ Winston 日誌
- ✅ 完整遊戲系統：境界、物品/裝備、技能、戰鬥、商城、任務、排行榜
- 🔄 自動化測試（Jest，覆蓋率建置中）

## 📦 主要套件

| 套件 | 用途 |
|------|------|
| `express` ^5.2 | Web 框架 |
| `pg` ^8.18 | PostgreSQL 客戶端 |
| `ws` ^8.19 | WebSocket |
| `bcrypt` ^6.0 | 密碼加密 |
| `jsonwebtoken` ^9.0 | JWT Token |
| `joi` ^18.1 | 輸入驗證 |
| `winston` ^3.19 | 日誌 |
| `dotenv` / `cors` | 環境變數 / 跨域 |

## 🚀 快速開始

### 1. 環境需求

- Node.js 16+
- PostgreSQL 14+

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並依需要修改：

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=IMMORTAL
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. 建立並初始化資料庫

SQL 腳本位於 `sql/`，依序執行：

```bash
# 1) 建立資料表
psql -U postgres -d IMMORTAL -f sql/setup_database.sql        # 境界相關表
psql -U postgres -d IMMORTAL -f sql/create_player_tables.sql
psql -U postgres -d IMMORTAL -f sql/create_item_tables.sql
psql -U postgres -d IMMORTAL -f sql/create_skill_tables.sql
psql -U postgres -d IMMORTAL -f sql/create_battle_tables.sql
psql -U postgres -d IMMORTAL -f sql/create_quest_tables.sql
psql -U postgres -d IMMORTAL -f sql/create_social_tables.sql

# 2) 灌入種子資料
psql -U postgres -d IMMORTAL -f sql/seed_data.sql
```

亦可使用根目錄的輔助腳本（透過 `.env` 連線）：

```bash
node setup_player_tables.js   # 建立玩家相關資料表
node import_realms.js         # 從 realms_setting.json 匯入境界資料
```

### 4. 啟動伺服器

```bash
npm install
npm run dev      # 開發模式（nodemon 自動重載）
# 或
npm start        # 生產模式
```

啟動後可訪問：

- **API 首頁**：http://localhost:3000/api
- **健康檢查**：http://localhost:3000/api/health
- **WebSocket**：ws://localhost:3000（與 HTTP 共用端口）

## 🧪 測試

後端使用 Jest（+ supertest）。整合測試以 mock 的資料庫模組執行，不需真實 DB。

```bash
npm test                 # 全部測試
npm run test:unit        # 單元測試
npm run test:integration # 整合測試
npm run test:coverage    # 覆蓋率報告

npx jest tests/unit/auth.validator.test.js   # 單一檔案
```

> ⚠️ 執行測試前務必先 `npm install`，缺少依賴會導致 Jest 報告 0% 覆蓋率且測試套件靜默失敗。

## 📁 專案結構

```
immortal/
├── src/
│   ├── config/database.js        # PostgreSQL 連接池
│   ├── controllers/              # 各領域控制器（auth/realm/inventory/skill/battle/leaderboard/shop/quest）
│   ├── middleware/               # auth（JWT）、validate（Joi）中間件
│   ├── validators/               # 各領域 Joi schema
│   ├── routes/                   # 路由（index.js 總匯掛載於 /api）
│   ├── websocket/handlers.js     # WebSocket 連線與訊息處理
│   └── utils/                    # logger（Winston）、questProgress（任務自動進度）
├── sql/                          # 資料表建立與種子資料腳本
├── frontend/                     # React + Vite 前端 SPA
├── server.js                     # 伺服器入口（HTTP + WebSocket）
└── package.json
```

請求處理鏈：`route → authenticateToken（JWT）→ validate(schema)（Joi）→ controller`。控制器以單例實例匯出，直接操作 `pg` 連接池;涉及貨幣/背包/境界的多步驟操作皆使用交易（BEGIN/COMMIT/ROLLBACK）。

## 🔌 API 端點

所有遊戲端點皆需在標頭帶入 `Authorization: Bearer <token>`。

### 身份驗證 `/api/auth`
| 方法 | 端點 | 說明 | 需認證 |
|------|------|------|:---:|
| POST | `/register` | 玩家註冊 | ❌ |
| POST | `/login` | 玩家登入 | ❌ |
| GET | `/verify` | 驗證 Token | ✅ |
| GET | `/me` | 獲取玩家完整資料 | ✅ |

### 境界系統 `/api/realms`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/` | 所有境界資料 |
| GET | `/player` | 玩家當前境界 |
| GET | `/player/history` | 突破歷史 |
| GET | `/player/requirements` | 突破需求 |
| POST | `/player/add-exp` | 增加境界經驗 |
| POST | `/player/breakthrough` | 嘗試突破 |
| POST | `/player/cultivate` | 掛機修煉（離線收益） |

### 物品與裝備 `/api/inventory`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/` | 背包 |
| GET | `/equipment` | 裝備欄 |
| GET | `/items` | 所有物品定義 |
| POST | `/use` | 使用物品 |
| POST | `/equip` | 裝備 |
| POST | `/unequip` | 卸下 |
| POST | `/discard` | 丟棄 |

### 技能系統 `/api/skills`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/available` | 可學習技能 |
| GET | `/player` | 已學技能 |
| POST | `/learn` | 學習技能 |
| POST | `/upgrade` | 升級技能 |
| POST | `/slot` | 設置技能欄 |

### 戰鬥系統 `/api/battle`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/monsters` | 可挑戰怪物 |
| POST | `/start` | 發起戰鬥（後端模擬結算） |
| POST | `/action-result` | 提交動作戰結果 |
| POST | `/sync-hp` | 同步 HP/MP |
| POST | `/restore-hp` | 以靈石回復 HP |
| GET | `/logs` | 戰鬥記錄 |

### 商城系統 `/api/shop`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/` | 所有商城 |
| GET | `/:shopId/items` | 商城物品 |
| POST | `/buy` | 購買 |
| POST | `/sell` | 出售 |
| GET | `/transactions` | 交易記錄 |

### 任務系統 `/api/quests`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/available` | 可接任務 |
| GET | `/player` | 玩家任務 |
| POST | `/accept` | 接取 |
| POST | `/progress` | 更新進度 |
| POST | `/complete` | 完成領獎 |
| POST | `/abandon` | 放棄 |

### 排行榜 `/api/leaderboard`
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/:type` | 排行榜（`realm`/`level`/`battle_wins`/`spirit_stones`） |
| GET | `/:type/me` | 玩家自身排名 |

### 系統
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查 |
| GET | `/api` | API 文檔 |

## 🌐 WebSocket 訊息

連線後需先送出 `AUTH`（攜帶 JWT）完成驗證,之後才能發送其他訊息。

| 類型 | 說明 |
|------|------|
| `AUTH` | 身份驗證（必須最先發送） |
| `PING` | 心跳（回 `PONG`） |
| `GET_ONLINE_COUNT` | 取得在線人數 |
| `GET_REALM_DATA` | 取得境界資料 |
| `GET_PLAYER_REALM` | 取得玩家境界 |
| `BREAKTHROUGH` | 即時境界突破 |
| `CHAT_MESSAGE` | 世界頻道聊天 |

伺服器主動廣播：`PLAYER_ONLINE` / `PLAYER_OFFLINE` / `REALM_BREAKTHROUGH` / `CHAT_MESSAGE` 等。

## 🖥️ 前端（`frontend/`）

React 19 + Vite + Tailwind CSS 的單頁應用,使用 `react-router-dom` 路由與 `axios` 呼叫 API,並透過 WebSocket 接收即時事件。涵蓋登入/註冊與儀表板、背包、境界、技能、戰鬥、商城、任務、排行榜等頁面。

```bash
cd frontend
npm install
npm run dev      # Vite 開發伺服器
npm run build    # 生產建置
npm run lint     # ESLint
```

## 📊 開發進度

| 階段 | 內容 | 狀態 |
|------|------|:---:|
| Phase 1 | 基礎架構 + 玩家系統（註冊/登入/玩家資料） | ✅ |
| Phase 2 | 境界系統（突破、經驗、修煉、歷史） | ✅ |
| Phase 3 | 物品與裝備系統 | ✅ |
| Phase 4 | 技能系統 | ✅ |
| Phase 5 | 戰鬥系統（含掉落、任務連動） | ✅ |
| Phase 6 | 社交與經濟（商城、排行榜、WebSocket 聊天/在線） | ✅ |
| Phase 7 | 任務系統（含自動進度追蹤） | ✅ |
| Phase 8 | 優化與測試 | 🔄 進行中 |

> 核心遊戲系統皆已實作完成;目前重點為提升自動化測試覆蓋率(現階段集中於 validators 與 middleware,controllers 與 WebSocket 層仍待補強)。

## 📚 相關文件

- [API_GUIDE.md](./API_GUIDE.md) — API 使用指南
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — 資料庫結構
- [BackEndRoadMap.md](./BackEndRoadMap.md) / [ROADMAP.md](./ROADMAP.md) — 開發路線圖
- [CLAUDE.md](./CLAUDE.md) — 給 AI 開發協作的專案指引

## 📄 授權

ISC License

---

**開始你的修仙之旅吧!** ⚡️
