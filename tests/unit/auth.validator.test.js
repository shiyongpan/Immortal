/**
 * auth 驗證 schema 單元測試
 */
const { registerSchema, loginSchema } = require("../../src/validators/auth.validator");

describe("registerSchema", () => {
  const valid = { username: "hero123", email: "hero@example.com", password: "secret123" };

  test("有效資料通過驗證", () => {
    const { error } = registerSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  test("username 包含特殊字元時失敗", () => {
    const { error } = registerSchema.validate({ ...valid, username: "he ro!" });
    expect(error).toBeDefined();
  });

  test("username 少於 3 字元時失敗", () => {
    const { error } = registerSchema.validate({ ...valid, username: "ab" });
    expect(error).toBeDefined();
  });

  test("email 格式錯誤時失敗", () => {
    const { error } = registerSchema.validate({ ...valid, email: "not-an-email" });
    expect(error).toBeDefined();
  });

  test("password 少於 6 字元時失敗", () => {
    const { error } = registerSchema.validate({ ...valid, password: "abc" });
    expect(error).toBeDefined();
  });

  test("缺少 password 時失敗", () => {
    const { error } = registerSchema.validate({ username: "hero123", email: "hero@example.com" });
    expect(error).toBeDefined();
  });

  test("displayName 為可選欄位", () => {
    const { error } = registerSchema.validate({ ...valid, displayName: "修仙者" });
    expect(error).toBeUndefined();
  });
});

describe("loginSchema", () => {
  test("有效資料通過驗證", () => {
    const { error } = loginSchema.validate({ login: "hero123", password: "secret123" });
    expect(error).toBeUndefined();
  });

  test("缺少 login 時失敗", () => {
    const { error } = loginSchema.validate({ password: "secret123" });
    expect(error).toBeDefined();
  });

  test("缺少 password 時失敗", () => {
    const { error } = loginSchema.validate({ login: "hero123" });
    expect(error).toBeDefined();
  });
});
