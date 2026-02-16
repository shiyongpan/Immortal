# 🎮 修仙 RPG API 使用指南

## 📋 目錄

- [快速開始](#快速開始)
- [API 端點](#api-端點)
- [測試範例](#測試範例)
- [下一步開發](#下一步開發)

---

## 快速開始

### 1. 確保資料庫已設定

```bash
# 確認 PostgreSQL 正在運行
# 執行 setup_database.sql 建立資料表
psql -U postgres -d IMMORTAL -f setup_database.sql
```

### 2. 啟動伺服器

```bash
# 開發模式 (自動重啟)
npm run dev

# 或一般模式
npm start
```

### 3. 測試伺服器

打開瀏覽器訪問:
- http://localhost:3000/api - API 首頁
- http://localhost:3000/api/health - 健康檢查

---

## API 端點

### 🔐 身份驗證 API

#### 1. 註冊新玩家

**POST** `/api/auth/register`

**請求體:**
```json
{
  "username": "test_player",
  "email": "test@example.com",
  "password": "password123",
  "displayName": "測試玩家"
}
```

**回應:**
```json
{
  "message": "註冊成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": {
    "id": 1,
    "username": "test_player",
    "email": "test@example.com",
    "displayName": "測試玩家",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. 玩家登入

**POST** `/api/auth/login`

**請求體:**
```json
{
  "login": "test_player",
  "password": "password123"
}
```

**回應:**
```json
{
  "message": "登入成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": {
    "id": 1,
    "username": "test_player",
    "email": "test@example.com",
    "displayName": "測試玩家"
  }
}
```

#### 3. 驗證 Token

**GET** `/api/auth/verify`

**請求標頭:**
```
Authorization: Bearer <your_token>
```

**回應:**
```json
{
  "valid": true,
  "user": {
    "playerId": 1,
    "username": "test_player"
  }
}
```

#### 4. 獲取玩家完整資料

**GET** `/api/auth/me`

**請求標頭:**
```
Authorization: Bearer <your_token>
```

**回應:**
```json
{
  "player": {
    "id": 1,
    "username": "test_player",
    "email": "test@example.com",
    "display_name": "測試玩家",
    "level": 1,
    "current_exp": 0,
    "required_exp": 100,
    "max_hp": 100,
    "current_hp": 100,
    "attack": 10,
    "defense": 5,
    "spirit_stones": 0,
    "realm_name": "凡人境",
    "stage_name": "初期"
  }
}
```

---

## 測試範例

### 使用 curl 測試

#### 1. 註冊玩家
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_player",
    "email": "test@example.com",
    "password": "password123",
    "displayName": "測試玩家"
  }'
```

#### 2. 登入
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "test_player",
    "password": "password123"
  }'
```

#### 3. 獲取玩家資料 (需要 token)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 使用 Postman 測試

1. 建立新請求
2. 選擇方法 (POST/GET)
3. 輸入 URL
4. 設定 Headers (如需要 Authorization)
5. 設定 Body (選擇 raw JSON)
6. 發送請求

### 使用 JavaScript fetch 測試

```javascript
// 註冊
const register = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'test_player',
      email: 'test@example.com',
      password: 'password123',
      displayName: '測試玩家'
    })
  });

  const data = await response.json();
  console.log(data);
  return data.token;
};

// 獲取玩家資料
const getPlayerData = async (token) => {
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log(data);
};

// 使用
register().then(token => getPlayerData(token));
```

---

## 下一步開發

根據你的 BackEndRoadMap.md,接下來可以實作:

### ✅ 已完成
- [x] 基礎專案架構
- [x] 資料庫連接
- [x] 身份驗證 API (註冊、登入、驗證)
- [x] JWT Token 機制
- [x] 密碼加密

### 🔄 待實作

#### Phase 1 剩餘工作
- [ ] 完善玩家資料 API
- [ ] 增加玩家屬性更新 API
- [ ] 玩家貨幣系統 API

#### Phase 2: 境界系統 API
- [ ] 境界突破 API (RESTful)
- [ ] 境界經驗增加 API
- [ ] 境界歷史查詢 API

#### Phase 3: 物品系統 API
- [ ] 背包系統 API
- [ ] 物品使用 API
- [ ] 裝備系統 API

---

## 🔧 專案結構

```
immortal/
├── src/
│   ├── config/
│   │   └── database.js          # 資料庫配置
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
├── .gitignore
├── server.js                    # 伺服器入口
├── package.json
└── API_GUIDE.md                 # 本文件
```

---

## 🛠️ 常見問題

### Q: 如何修改資料庫連接?
A: 編輯 `.env` 檔案中的資料庫設定

### Q: Token 過期怎麼辦?
A: 重新登入獲取新的 Token,或實作 Token 刷新機制

### Q: 如何添加新的 API 端點?
A:
1. 在 `src/controllers/` 建立新的控制器
2. 在 `src/routes/` 建立新的路由檔案
3. 在 `src/routes/index.js` 註冊新路由

### Q: WebSocket 和 RESTful API 的差異?
A:
- RESTful API: 適合一般的請求-回應操作
- WebSocket: 適合即時雙向通訊 (如戰鬥、聊天)

---

## 📚 相關資源

- [Express 文檔](https://expressjs.com/)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [JWT 介紹](https://jwt.io/)
- [Node.js 最佳實踐](https://github.com/goldbergyoni/nodebestpractices)

---

**祝你開發順利!** 🚀
