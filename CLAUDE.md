# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 溝通語言 (Communication Language)

與使用者溝通時一律使用**繁體中文**回覆。

## 專案概覽 (Overview)

修仙題材 RPG 遊戲。後端（repo root）為 Node.js + Express 5 + PostgreSQL API；前端（`frontend/`）為 React 19 + Vite + Tailwind + Three.js 3D SPA。程式碼註解與所有面向使用者的字串（錯誤訊息、回應文字）均使用**繁體中文**撰寫，修改時請保持一致。

## 常用指令 (Commands)

### 後端 Backend（repo root）
```bash
npm install                 # 必須先執行，缺少 dependency 會導致 Jest 靜默失敗、coverage 回報 0%
npm run dev                 # nodemon server.js（auto-reload）
npm start                   # node server.js

npm test                    # 執行全部 Jest tests（runInBand）
npm run test:unit           # 只跑 tests/unit
npm run test:integration    # 只跑 tests/integration
npm run test:coverage       # 產生 coverage report

npx jest tests/unit/auth.validator.test.js   # 執行單一測試檔
npx jest -t "暴擊率 0%"                        # 以測試名稱執行單一 test（名稱為中文）
```

### 前端 Frontend（`frontend/`）
```bash
npm run dev      # Vite dev server（預設 port 5173）
npm run build    # 產生 production build
npm run preview  # 本地預覽 production build
npm run lint     # ESLint（未設定 test runner）
```

### 注意事項 (Notes)
- `nodemon` 不在 `devDependencies` 中，需全域安裝（`npm i -g nodemon`）才能使用 `npm run dev`。
- 根目錄的 `quick_test.js` 與 `test_api.js` 是手動的 ad-hoc 腳本，不屬於 Jest 測試套件。

### 資料庫 Database
PostgreSQL 需手動建立並 seed。SQL 檔案放在 `sql/`（依序執行 `sql/setup_database.sql`、各 `create_*.sql`，再執行 `sql/seed_data.sql`）。根目錄的 `setup_player_tables.js` 和 `import_realms.js` 可用 `node <script>.js` 個別執行。連線設定完全來自環境變數（`.env`，參考 `.env.example`）：`DB_HOST/PORT/NAME/USER/PASSWORD`、`JWT_SECRET`、`JWT_EXPIRES_IN`、`PORT`。

## 系統架構 (Architecture)

### Request Pipeline
`server.js` 將所有請求掛載於 `/api`，透過 `src/routes/index.js` 分派至各 domain router（`auth`、`realms`、`inventory`、`skills`、`battle`、`leaderboard`、`shop`、`quests`）。每個 route 檔案遵循相同的責任鏈：

`route → authenticateToken (JWT) → validate(schema, target) → controller method`

- **Auth**（`src/middleware/auth.middleware.js`）：`authenticateToken` 驗證 Bearer JWT，並將 `req.user = { playerId, username }` 注入後續 middleware。`optionalAuth` 為不強制驗證的變體。
- **Validation**（`src/middleware/validate.middleware.js` + `src/validators/*`）：`validate(schema, target='body')` 是一個回傳 Joi middleware 的 factory。使用 `{ abortEarly: false, stripUnknown: true }`，並**直接覆寫 `req[target]`**——因此預設值（如 `limit` 預設 20）與型別轉換在此發生，controller 不需重複處理。
- **Controllers**（`src/controllers/*`）：以 singleton 實例匯出（`module.exports = new XController()`）。**沒有 service layer**（儘管 README 有提及）——controller 直接操作 `pg` pool。

### 資料庫存取模式 (Database Access Pattern)
`src/config/database.js` 匯出單一共用的 `pg` `Pool`，使用兩種模式：
- 簡單讀寫：`pool.query(...)`。
- 多步驟異動：`pool.connect()` 取得 client，接著 `BEGIN` / ... / `COMMIT`，`catch` 中 `ROLLBACK`，`finally` 中 `client.release()`。所有涉及貨幣、背包或境界狀態的遊戲行為均遵循此 transaction 模式（參考 `battle.controller.startBattle`）。

### WebSocket Layer（`src/websocket/handlers.js`）
`ws` server 與 HTTP server 共用同一個 port（在 `server.js` 中以同一個 `server` 建立）。以記憶體內的 `onlinePlayers` Map（`playerId → ws`）維護連線，提供 `broadcast()` / `sendToPlayer()` 工具函式。Client 必須先送出 `AUTH` 訊息（JWT）才能使用其他訊息類型；成功後 `ws.playerId` / `ws.username` 會被設定。訊息類型以 `switch` 分派（`PING`、`GET_REALM_DATA`、`BREAKTHROUGH`、`CHAT_MESSAGE` 等）。**重要：** 境界突破同時實作於此（`handleBreakthrough`）與 REST realm controller，修改突破規則時兩處都要更新。

### 核心領域：境界系統 (Core Domain: Realm Progression)
遊戲核心為修仙境界系統。`realms`（以 `realm_order` 排序）各自包含 `realm_stages`（以 `stage_order` 排序，`is_extreme` 標記極境）。玩家位置記錄於 `player_realms`（`current_realm_id`、`current_stage_id`、`current_exp`）。突破會從當前階段推進至下一境界的第一階段，成功率在極境時降低且可被丹藥加成；失敗消耗約 30% 修為。由於修為數值很大，比較時使用 `BigInt`。

### 任務自動推進 (Quest Auto-Progression)
`src/utils/questProgress.js` 的 `updateQuestProgress(client, playerId, stepType, targetId, incrementBy)` 在遊戲行為的 transaction 內被呼叫（例如 `battle.controller` 勝利後），用以推進進行中的任務步驟。此函式**刻意吞掉自己的錯誤**（僅記錄 log），確保任務追蹤失敗不會 rollback 主流程。

### 境界常數 (Realm Controller Constants)
`src/controllers/realm.controller.js` 頂部有兩個硬編碼的遊戲平衡設定表：
- `BREAKTHROUGH_PILL_BY_REALM`：將 `realm_order`（1–5）對應到該境界突破輔助丹藥的 item ID
- `CULTIVATION_RATE_PER_MIN`：將 `realm_order` 對應到自動修練每分鐘獲得的修為（築基境以上）

這兩個表是調整境界進程速度的主要參數。

### 前端架構 (Frontend Architecture)
`frontend/` 的 React SPA 以三個 React Context 和一個鏡像 API layer 為核心：

**Contexts（`frontend/src/contexts/`）**
- `AuthContext`：管理玩家 session，包含 `player` 物件、JWT `token`、`login`/`register`/`logout`、`refreshPlayer`。401 時由 axios client（非 context 本身）清除 token 並強制跳轉 `/login`。
- `BattleContext`：輕量，僅持有 `battleStats`（閒置時為 `null`，戰鬥中為 `{ hp, maxHp, mp, maxMp }`），讓多個 component 無需 prop drilling 即可讀取即時 HP。
- `WebSocketContext`：負責 WS 連線生命週期（hardcode 連至 `ws://localhost:3000`）。對外暴露 `connected`、`onlineCount`、`chatMessages`、`notifications`、`connect(token)`、`disconnect()`、`sendChat(msg)`。斷線時最多自動重連 5 次，間隔 3 秒。

**API Layer（`frontend/src/api/`）**
每個 backend domain 對應一個獨立檔案（`auth.js`、`battle.js`、`inventory.js` 等），均 import 共用的 `client.js` axios 實例。`client.js`：
- Base URL hardcode 為 `http://localhost:3000/api`
- 每次請求自動從 `localStorage` 注入 `Authorization: Bearer <token>`
- 收到 401 response 時清除 token 並跳轉 `/login`

**3D 渲染層（核心架構）**
前端以 Three.js（`@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing`）為主要渲染引擎，而非傳統 React DOM 頁面切換。

- `GameLayout.jsx` 驗證登入後直接渲染 `GameWorld.jsx`（Three.js `<Canvas>`）。
- `GameWorld.jsx` 根據 URL path，透過 `SCENE_MAP`（path → Scene3D 元件）和 `SCENE_HUD_MAP`（path → HUD 元件）動態切換場景，本身**不是** React Router `<Routes>`。
- `frontend/src/scenes/*Scene3D.jsx`：每個 domain 一個 3D 場景（Three.js 物件 + 遊戲邏輯），是遊戲的實際畫面。
- `frontend/src/pages/game/*Page.jsx`：HTML UI 面板（清單、按鈕、道具欄等），以 `BridgedHtml` 嵌入 3D Canvas 內的 HTML overlay，**不是**獨立 route 元件。`LoginPage` / `RegisterPage` 是例外，為真實路由頁面。
- `BridgedHtml.jsx`（`frontend/src/components/3d/BridgedHtml.jsx`）：使用 `useContextBridge` 將 AuthContext、WebSocketContext、BattleContext 及 Router context 橋接進 Three.js `<Html>` 環境，讓 pages 能在 Canvas 內正常使用 context。

**戰鬥小遊戲引擎**
`frontend/src/components/battle/ActionBattle.jsx` + `gameEngine.js` 是一套獨立的 **2D Canvas 引擎**（非 Three.js），在 `BattleScene3D` 場景內運行。`gameEngine.js` 匯出工廠函式（`createPlayer`、`createEnemy`）、碰撞偵測、傷害計算（`calcDmg`）與粒子系統。`BattleScene3D.jsx` 頂部定義了模組層級的 mutable signal var（`battleAnimSignal`、`battleHitSignal`），用以協調 React state 與 Three.js `useFrame` 動畫迴圈之間的事件通知。

**鏡像常數警示**
`frontend/src/scenes/RealmScene3D.jsx` 頂部的 `BREAKTHROUGH_PILL`（item ID）與 `CULTIVATION_RATE`（每分鐘修為）必須與後端 `src/controllers/realm.controller.js` 的 `BREAKTHROUGH_PILL_BY_REALM` / `CULTIVATION_RATE_PER_MIN` **保持同步**；修改境界平衡時兩處都要更新。

**共用工具（`frontend/src/utils/`）**
- `format.js`：`formatNumber`（萬/億格式化）、`formatPercent`、`RARITY_COLORS`（稀有度 Tailwind class map）
- `storage.js`：localStorage token 存取封裝

**可重用 UI 元件（`frontend/src/components/ui/`）**：`Button`、`Card`、`Modal`、`Notification`、`ProgressBar`

`useApi` hook（`frontend/src/hooks/useApi.js`）是 component 呼叫非同步 API 的標準模式，回傳 `{ data, loading, error, execute, setData }`。

### Logging
`src/utils/logger.js` 是全專案使用的 Winston logger。測試中透過 `tests/setup.js` mock 掉。

## 測試說明 (Testing Notes)

- Jest 設定在 `package.json`；`tests/setup.js` 設定測試用環境變數（`JWT_SECRET` 等）並 mock logger。
- **Integration tests mock 資料庫模組**，而非連接真實 DB：`jest.mock("../../src/config/database")` 回傳可被各 test 控制的假 pool（`query`/`connect`）。在測試中用 `express()` + `require("../../src/routes")` 建立 app，並以測試用 `JWT_SECRET` 簽發 token（參考 `tests/integration/battle.routes.test.js`）。
- Coverage 目前偏低，集中於 validators/middleware；大部分 controller 與 WebSocket layer 尚未測試。
- 前端已安裝 Playwright（`frontend/devDependencies`），但目前尚無 e2e test 檔案。

<!-- AI_INSTRUCTIONS_START -->
# 🤖 AI Coding Guidelines (For LLM Assistants)

> **ATTENTION AI:** You MUST strictly read and follow the constraints below when assisting with this project.

## 角色與情境定位 (Role & Context)
你是一位資深的後端軟體工程師。你的目標是協助使用者編寫乾淨、具備可維護性且符合生產環境標準的程式碼。

## 觸發條件 (Trigger Condition)
重要：只有當使用者的提示詞涉及「軟體開發、寫程式、重構（Refactoring）或代碼審查（Code Review）」時，才嚴格執行下方的 "Karpathy Guidelines"。若是對話、寫作或旅遊規劃等非程式任務，請以自然方式回覆，不受此限。

## Karpathy Guidelines (程式任務行為準則)

### 1. 思考先行 (Think Before Coding)
- 在動手寫程式之前，必須先明確列出你的「假設（Assumptions）」。如果需求有模糊不清的地方，請直接提問澄清，絕不盲目瞎猜。
- 如果存在多種技術實現方案，在選擇其中一種之前，請簡要陳述各自的優缺點（Tradeoffs）。

### 2. 最簡優先 (Simplicity First)
- 只寫能夠解決當前特定問題的最少代碼。拒絕任何「預測性、未來可能用到（Speculative）」的功能。
- 避免過度抽象化（Premature abstractions）、不需要的配置彈性、或針對不可能發生的情境編寫防禦性錯誤處理。
- 保持程式碼精簡。如果可以用 50 行乾淨利落地解決，就絕不寫 200 行。

### 3. 精準修改 (Surgical Changes)
- 在修改既有程式碼時，只觸發與需求絕對相關的改動（Touch ONLY what is necessary）。
- 除非使用者明確要求，否則絕不「順便優化」或重新格式化鄰近的代碼、註解或排版。
- 必須完美符合既有的程式風格（Match existing style），即使你個人偏好其他寫法。
- 移除所有因為「你的改動」而變成無用的 Import、變數或 Function。但不要去清理專案原本就存在的死代碼（Dead code）。

### 4. 目標驅動與驗證 (Goal-Driven Execution)
- 針對任何多步驟的程式任務，在回覆的最開頭，必須使用以下格式列出簡要的執行與驗證計畫：
  1. [步驟說明] → verify: [驗證檢查點]
  2. [步驟說明] → verify: [驗證檢查點]
- 定義明確的成功標準（例如特定的測試案例或驗證步驟），並在交付最終代碼前，確認程式碼完全符合這些標準。
<!-- AI_INSTRUCTIONS_END -->
