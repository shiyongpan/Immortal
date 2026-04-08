require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// PostgreSQL 連接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function importRealmData() {
  const client = await pool.connect();

  try {
    console.log("🚀 開始導入境界資料...\n");

    // 讀取 JSON 檔案
    const jsonPath = path.join(__dirname, "realms_setting.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const realms = data.realms; // 獲取境界數組

    // 開始交易
    await client.query("BEGIN");

    let totalRealms = 0;
    let totalStages = 0;
    let totalBreakthroughs = 0;
    let totalSkills = 0;
    let totalEquipments = 0;

    // 遍歷每個境界
    for (const realmData of realms) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📝 正在導入: ${realmData.realm_name} (${realmData.realm_name_en})`);
      console.log(`${"=".repeat(60)}`);

      // 1. 插入境界基本資料
      const realmResult = await client.query(
        `
                INSERT INTO realms (
                    realm_name, realm_name_en, realm_order, description,
                    max_hp, max_mp, attack, defense, spirit
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `,
        [
          realmData.realm_name,
          realmData.realm_name_en,
          realmData.realm_order,
          realmData.description,
          realmData.max_hp,
          realmData.max_mp,
          realmData.attack,
          realmData.defense,
          realmData.spirit,
        ],
      );

      const realmId = realmResult.rows[0].id;
      console.log(`✅ 境界基本資料插入成功 (ID: ${realmId})`);
      totalRealms++;

      // 2. 插入境界階段
      console.log(`\n  📋 插入階段資料...`);
      for (const stage of realmData.stages) {
        await client.query(
          `
                    INSERT INTO realm_stages (
                        realm_id, stage_name, stage_name_en, stage_order,
                        is_extreme, exp_required, stat_multiplier, stat_bonus
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `,
          [
            realmId,
            stage.stage_name,
            stage.stage_name_en,
            stage.stage_order,
            stage.is_extreme,
            stage.exp_required,
            stage.stat_multiplier,
            JSON.stringify(stage.stat_bonus),
          ],
        );
        console.log(
          `     ✅ ${stage.stage_name} (${stage.is_extreme ? "極境" : "普通階段"})`,
        );
        totalStages++;
      }

      // 3. 插入突破需求
      console.log(`\n  🔓 插入突破需求...`);
      for (const req of realmData.breakthrough_requirements) {
        await client.query(
          `
                    INSERT INTO breakthrough_requirements (
                        realm_id, breakthrough_type, requirement_type, requirement_data
                    ) VALUES ($1, $2, $3, $4)
                `,
          [
            realmId,
            req.breakthrough_type,
            req.requirement_type,
            JSON.stringify(req.requirement_data),
          ],
        );
        console.log(
          `     ✅ ${req.breakthrough_type} - ${req.requirement_type}`,
        );
        totalBreakthroughs++;
      }

      // 4. 插入技能解鎖
      console.log(`\n  ⚔️  插入技能解鎖...`);
      for (const skill of realmData.skill_unlocks) {
        await client.query(
          `
                    INSERT INTO skill_unlocks (
                        realm_id, stage_name, skill_id, skill_name, is_extreme_only
                    ) VALUES ($1, $2, $3, $4, $5)
                `,
          [
            realmId,
            skill.stage_name,
            skill.skill_id,
            skill.skill_name,
            skill.is_extreme_only,
          ],
        );
        console.log(
          `     ✅ ${skill.stage_name}: ${skill.skill_name} ${skill.is_extreme_only ? "(極境專屬)" : ""}`,
        );
        totalSkills++;
      }

      // 5. 插入裝備解鎖
      console.log(`\n  🛡️  插入裝備解鎖...`);
      for (const equip of realmData.equipment_unlocks) {
        await client.query(
          `
                    INSERT INTO equipment_unlocks (
                        realm_id, stage_name, min_level, is_extreme_only
                    ) VALUES ($1, $2, $3, $4)
                `,
          [
            realmId,
            equip.stage_name,
            equip.min_level,
            equip.is_extreme_only,
          ],
        );
        console.log(
          `     ✅ ${equip.stage_name}: Lv.${equip.min_level}+ ${equip.is_extreme_only ? "(極境專屬)" : ""}`,
        );
        totalEquipments++;
      }

      console.log(`\n  ✅ ${realmData.realm_name} 導入完成！`);
    }

    // 提交交易
    await client.query("COMMIT");

    // 輸出統計信息
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎉 所有境界資料導入成功！`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 統計資訊:`);
    console.log(`   - 境界數量: ${totalRealms}`);
    console.log(`   - 階段總數: ${totalStages}`);
    console.log(`   - 突破需求: ${totalBreakthroughs}`);
    console.log(`   - 技能解鎖: ${totalSkills}`);
    console.log(`   - 裝備解鎖: ${totalEquipments}`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    // 發生錯誤時回滾
    await client.query("ROLLBACK");
    console.error("\n❌ 導入失敗:", error);
    console.error("\n錯誤詳情:", error.message);
    if (error.stack) {
      console.error("\n堆疊追蹤:", error.stack);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 執行導入
importRealmData()
  .then(() => {
    console.log("✅ 程序執行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 程序執行失敗:", error.message);
    process.exit(1);
  });
