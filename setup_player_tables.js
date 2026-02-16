/**
 * 執行玩家帳號資料表建立腳本
 * 用法: node setup_player_tables.js
 */

require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function setupPlayerTables() {
    console.log('🎮 開始建立玩家帳號相關資料表...\n');

    try {
        // 讀取 SQL 檔案
        const sql = fs.readFileSync('./create_player_tables.sql', 'utf8');

        // 執行 SQL
        await pool.query(sql);

        console.log('✅ 資料表建立成功!\n');

        // 檢查建立的資料表
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'player%'
            ORDER BY table_name
        `);

        console.log('📋 已建立的資料表:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        console.log('\n🔍 資料表詳情:');

        // 檢查每個資料表的欄位數量
        const tables = ['players', 'player_stats', 'player_currencies', 'player_realms', 'player_settings'];

        for (const table of tables) {
            const columns = await pool.query(`
                SELECT COUNT(*) as count
                FROM information_schema.columns
                WHERE table_name = $1
            `, [table]);

            console.log(`   ${table}: ${columns.rows[0].count} 個欄位`);
        }

        console.log('\n✨ 完成! 現在可以使用 API 註冊玩家了!');

    } catch (error) {
        console.error('❌ 建立資料表失敗:', error.message);
        console.error('\n💡 請確認:');
        console.error('1. PostgreSQL 服務已啟動');
        console.error('2. 資料庫 IMMORTAL 已建立');
        console.error('3. .env 檔案設定正確');
    } finally {
        await pool.end();
    }
}

setupPlayerTables();
