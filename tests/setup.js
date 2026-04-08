// 測試環境設定
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_key_for_jest";
process.env.JWT_EXPIRES_IN = "1h";
process.env.PORT = "3001";

// 靜音 Winston 日誌（測試時不需要輸出）
jest.mock("../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
