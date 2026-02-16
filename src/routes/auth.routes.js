const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * 身份驗證路由
 */

// 註冊新玩家
router.post('/register', authController.register);

// 玩家登入
router.post('/login', authController.login);

// 驗證 Token (需要認證)
router.get('/verify', authenticateToken, authController.verify);

// 獲取玩家資料 (需要認證)
router.get('/me', authenticateToken, authController.getPlayerData);

module.exports = router;
