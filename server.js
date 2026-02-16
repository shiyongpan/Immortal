require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const pool = require('./src/config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 中間件設定
 */
app.use(cors()); // 允許跨域請求
app.use(express.json()); // 解析 JSON 請求體
app.use(express.urlencoded({ extended: true })); // 解析 URL 編碼

/**
 * 請求日誌中間件
 */
app.use((req, res, next) => {
    console.log(`📩 ${req.method} ${req.path}`);
    next();
});

/**
 * API 路由
 */
app.use('/api', routes);

/**
 * 404 錯誤處理
 */
app.use((req, res) => {
    res.status(404).json({
        error: '找不到該路由',
        path: req.path
    });
});

/**
 * 全域錯誤處理
 */
app.use((err, req, res, next) => {
    console.error('❌ 伺服器錯誤:', err);
    res.status(500).json({
        error: '伺服器內部錯誤',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/**
 * 測試資料庫連接
 */
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ 資料庫連接失敗:', err);
    } else {
        console.log('✅ 資料庫連接成功:', res.rows[0].now);
    }
});

/**
 * 啟動 HTTP 伺服器
 */
const server = app.listen(PORT, () => {
    console.log(`🚀 HTTP 伺服器運行於: http://localhost:${PORT}`);
    console.log(`📚 API 文檔: http://localhost:${PORT}/api`);
    console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
});

/**
 * WebSocket 伺服器 (保留原有功能)
 */
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('✅ 新玩家 WebSocket 連接');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📩 WebSocket 收到訊息:', data.type);

            // 處理不同類型的請求
            switch (data.type) {
                case 'GET_REALM_DATA':
                    await handleGetRealmData(ws, data);
                    break;
                case 'GET_PLAYER_REALM':
                    await handleGetPlayerRealm(ws, data);
                    break;
                case 'BREAKTHROUGH':
                    await handleBreakthrough(ws, data);
                    break;
                default:
                    ws.send(JSON.stringify({ error: '未知的請求類型' }));
            }
        } catch (error) {
            console.error('❌ WebSocket 處理錯誤:', error);
            ws.send(JSON.stringify({ error: '伺服器錯誤' }));
        }
    });

    ws.on('close', () => {
        console.log('❌ 玩家 WebSocket 斷線');
    });

    // 發送歡迎訊息
    ws.send(JSON.stringify({
        type: 'WELCOME',
        message: '歡迎來到修仙世界!'
    }));
});

/**
 * WebSocket 處理函數
 */

// 獲取所有境界資料
async function handleGetRealmData(ws, data) {
    try {
        const result = await pool.query(`
            SELECT r.*, rs.*
            FROM realms r
            JOIN realm_stages rs ON r.id = rs.realm_id
            ORDER BY r.realm_order, rs.stage_order
        `);

        ws.send(JSON.stringify({
            type: 'REALM_DATA',
            data: result.rows
        }));
    } catch (error) {
        console.error('獲取境界資料錯誤:', error);
        ws.send(JSON.stringify({ error: '獲取境界資料失敗' }));
    }
}

// 獲取玩家當前境界
async function handleGetPlayerRealm(ws, data) {
    try {
        const { playerId } = data;

        const result = await pool.query(
            `SELECT pr.*, r.realm_name, rs.stage_name
             FROM player_realms pr
             JOIN realms r ON pr.current_realm_id = r.id
             JOIN realm_stages rs ON pr.current_stage_id = rs.id
             WHERE pr.player_id = $1`,
            [playerId]
        );

        ws.send(JSON.stringify({
            type: 'PLAYER_REALM',
            data: result.rows[0]
        }));
    } catch (error) {
        console.error('獲取玩家境界錯誤:', error);
        ws.send(JSON.stringify({ error: '獲取玩家境界失敗' }));
    }
}

// 處理境界突破
async function handleBreakthrough(ws, data) {
    try {
        const { playerId } = data;

        // TODO: 實作完整的突破邏輯
        // 1. 檢查經驗值是否足夠
        // 2. 檢查是否有突破道具
        // 3. 極境突破有機率失敗
        // 4. 更新玩家境界

        ws.send(JSON.stringify({
            type: 'BREAKTHROUGH_RESULT',
            success: true,
            message: '突破成功!'
        }));
    } catch (error) {
        console.error('突破處理錯誤:', error);
        ws.send(JSON.stringify({ error: '突破處理失敗' }));
    }
}

/**
 * 優雅關閉
 */
process.on('SIGTERM', () => {
    console.log('📴 收到 SIGTERM 信號,正在關閉伺服器...');
    server.close(() => {
        console.log('✅ HTTP 伺服器已關閉');
        pool.end(() => {
            console.log('✅ 資料庫連接已關閉');
            process.exit(0);
        });
    });
});

console.log('🎮 修仙 RPG 伺服器啟動完成!');
