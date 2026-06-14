/**
 * 戰鬥傷害計算單元測試
 * 直接 import battle.controller 匯出的真實 calcDamage 函數（純函數，無副作用）
 */
const { calcDamage } = require("../../src/controllers/battle.controller");

describe("calcDamage", () => {
  afterEach(() => {
    jest.spyOn(Math, "random").mockRestore();
  });

  test("傷害值至少為 1", () => {
    // 防禦遠大於攻擊時，傷害不應為 0 或負數
    const result = calcDamage(1, 9999, 0, 150);
    expect(result.damage).toBeGreaterThanOrEqual(1);
    expect(result.isCrit).toBe(false);
  });

  test("暴擊率 0% 時不會暴擊", () => {
    for (let i = 0; i < 100; i++) {
      const result = calcDamage(100, 10, 0, 200);
      expect(result.isCrit).toBe(false);
    }
  });

  test("暴擊率 100% 時一定暴擊", () => {
    for (let i = 0; i < 20; i++) {
      const result = calcDamage(100, 10, 100, 200);
      expect(result.isCrit).toBe(true);
    }
  });

  test("暴擊傷害正確計算（2x）", () => {
    jest.spyOn(Math, "random").mockReturnValue(0); // random() = 0 → 確定暴擊且 +0 隨機傷害
    const result = calcDamage(100, 10, 100, 200);
    // dmg = max(1, 100 - 10 + 0) = 90, crit = floor(90 * 200/100) = 180
    expect(result.damage).toBe(180);
    expect(result.isCrit).toBe(true);
  });

  test("傷害計算包含防禦減免", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const result = calcDamage(50, 20, 0, 150);
    // dmg = max(1, 50 - 20 + 0) = 30
    expect(result.damage).toBe(30);
    expect(result.isCrit).toBe(false);
  });

  test("隨機傷害浮動最多 +4（random 接近 1 時）", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.99); // floor(0.99*5)=4，且不暴擊
    const result = calcDamage(50, 20, 0, 150);
    // dmg = max(1, 50 - 20 + 4) = 34
    expect(result.damage).toBe(34);
    expect(result.isCrit).toBe(false);
  });
});
