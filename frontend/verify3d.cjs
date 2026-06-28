const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[JS ERR] ' + m.text().substring(0,120)); });
  page.on('pageerror', e => errors.push('[PAGE ERR] ' + e.message.substring(0,120)));

  // Step 1: Login page
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
  await page.screenshot({ path: 'verify_ss_login.png' });
  console.log('1 Login page loaded, title:', await page.title());

  // Step 2: Fill and submit login
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].fill('verify3d');
    await inputs[1].fill('verify123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/game**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(5000);
  }
  const url2 = page.url();
  console.log('2 After login URL:', url2);
  await page.screenshot({ path: 'verify_ss_game.png' });

  // Step 3: Check canvas and 3D world
  const canvas = await page.$('canvas');
  console.log('3 Canvas present:', !!canvas);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('3 Has 修仙世界:', bodyText.includes('修仙世界'));
  console.log('3 Has portal hint:', bodyText.includes('點擊傳送門'));

  // Step 4: Battle scene (use load not networkidle — WebSocket keeps network busy)
  await page.goto('http://localhost:5173/game/battle', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'verify_ss_battle.png' });
  const battleBody = await page.evaluate(() => document.body.innerText);
  console.log('4 Battle - has 戰鬥挑戰:', battleBody.includes('戰鬥挑戰'));
  console.log('4 Battle - canvas:', !!(await page.$('canvas')));

  // Step 5: Realm scene
  await page.goto('http://localhost:5173/game/realm', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'verify_ss_realm.png' });
  const realmBody = await page.evaluate(() => document.body.innerText);
  console.log('5 Realm - has 境界突破:', realmBody.includes('境界突破'));
  console.log('5 Realm - canvas:', !!(await page.$('canvas')));

  // Step 6: Shop scene
  await page.goto('http://localhost:5173/game/shop', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'verify_ss_shop.png' });
  const shopBody = await page.evaluate(() => document.body.innerText);
  console.log('6 Shop - has 仙靈商城:', shopBody.includes('仙靈商城'));
  console.log('6 Shop - canvas:', !!(await page.$('canvas')));

  // Step 7: Hub final
  await page.goto('http://localhost:5173/game', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verify_ss_hub_final.png' });

  console.log('\nERRORS (' + errors.length + '):', errors.slice(0,5).join('\n'));
  await browser.close();
})();
