/**
 * API 測試腳本
 * 使用方法: node test_api.js
 */

const BASE_URL = 'http://localhost:3000/api';
let token = '';

// 輔助函數: 發送請求
async function request(endpoint, method = 'GET', body = null, useAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (useAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        console.log(`\n${'='.repeat(60)}`);
        console.log(`${method} ${endpoint}`);
        console.log(`狀態: ${response.status} ${response.statusText}`);
        console.log('回應:');
        console.log(JSON.stringify(data, null, 2));

        return data;
    } catch (error) {
        console.error('請求錯誤:', error.message);
        return null;
    }
}

// 測試流程
async function runTests() {
    console.log('🎮 開始測試修仙 RPG API...\n');

    // 1. 健康檢查
    console.log('📍 測試 1: 健康檢查');
    await request('/health');

    // 2. 註冊新玩家
    console.log('\n📍 測試 2: 註冊新玩家');
    const username = `test_player_${Date.now()}`;
    const registerData = await request('/auth/register', 'POST', {
        username,
        email: `${username}@example.com`,
        password: 'password123',
        displayName: '測試玩家'
    });

    if (registerData && registerData.token) {
        token = registerData.token;
        console.log('\n✅ 註冊成功! Token 已保存');
    }

    // 3. 驗證 Token
    console.log('\n📍 測試 3: 驗證 Token');
    await request('/auth/verify', 'GET', null, true);

    // 4. 獲取玩家資料
    console.log('\n📍 測試 4: 獲取玩家完整資料');
    await request('/auth/me', 'GET', null, true);

    // 5. 使用錯誤的密碼登入
    console.log('\n📍 測試 5: 錯誤密碼登入 (應該失敗)');
    await request('/auth/login', 'POST', {
        login: username,
        password: 'wrong_password'
    });

    // 6. 正確登入
    console.log('\n📍 測試 6: 正確登入');
    await request('/auth/login', 'POST', {
        login: username,
        password: 'password123'
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有測試完成!');
    console.log('='.repeat(60));
}

// 執行測試
runTests().catch(console.error);
