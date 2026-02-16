const express = require('express');
const router = express.Router();

// 導入各個路由模組
const authRoutes = require('./auth.routes');

/**
 * API 路由總匯
 */

// 身份驗證路由
router.use('/auth', authRoutes);

// 健康檢查路由
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '伺服器運行正常',
        timestamp: new Date().toISOString()
    });
});

// 根路徑
router.get('/', (req, res) => {
    res.json({
        message: '歡迎來到修仙 RPG API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
        }
    });
});

module.exports = router;
