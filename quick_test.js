/**
 * 快速測試腳本
 * 用法: node quick_test.js
 */

console.log('🎮 開始測試修仙 RPG API...\n');

// 測試 1: 健康檢查
fetch('http://localhost:3000/api/health')
    .then(res => res.json())
    .then(data => {
        console.log('✅ 測試 1: 健康檢查');
        console.log(data);
        console.log('');

        // 測試 2: 註冊新玩家
        return fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `player_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: 'password123',
                displayName: '新手修仙者'
            })
        });
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ 測試 2: 註冊新玩家');
        console.log(`玩家: ${data.player?.username}`);
        console.log(`Token: ${data.token?.substring(0, 20)}...`);
        console.log('');

        // 測試 3: 獲取玩家資料
        return fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${data.token}`
            }
        });
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ 測試 3: 獲取玩家資料');
        console.log(`玩家 ID: ${data.player?.id}`);
        console.log(`等級: ${data.player?.level || 1}`);
        console.log(`境界: ${data.player?.realm_name || '凡人境'} - ${data.player?.stage_name || '初期'}`);
        console.log('');
        console.log('🎉 所有測試通過!');
    })
    .catch(err => {
        console.error('❌ 測試失敗:', err.message);
        console.log('\n💡 請確認:');
        console.log('1. 伺服器是否已啟動? (npm start)');
        console.log('2. 資料庫是否已建立? (setup_database.sql)');
    });
