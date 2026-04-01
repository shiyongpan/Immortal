/**
 * Joi 驗證中間件單元測試
 */
const Joi = require("joi");
const validate = require("../../src/middleware/validate.middleware");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("validate middleware", () => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    age: Joi.number().integer().min(0).optional(),
  });

  test("有效輸入時呼叫 next()", () => {
    const req = { body: { name: "Alice", age: 25 } };
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("無效輸入時回傳 400", () => {
    const req = { body: { name: "A" } }; // name 太短
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "輸入驗證失敗" })
    );
  });

  test("缺少必填欄位時回傳 400", () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("多個驗證錯誤時回傳所有錯誤詳情", () => {
    const multiSchema = Joi.object({
      a: Joi.string().required(),
      b: Joi.number().required(),
    });
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    validate(multiSchema)(req, res, next);

    const call = res.json.mock.calls[0][0];
    expect(call.details).toHaveLength(2);
  });

  test("stripUnknown — 未知欄位被過濾", () => {
    const req = { body: { name: "Alice", unknown: "field" } };
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty("unknown");
  });

  test("可驗證 query 參數", () => {
    const querySchema = Joi.object({ page: Joi.number().default(1) });
    const req = { query: {} };
    const res = mockRes();
    const next = jest.fn();

    validate(querySchema, "query")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(1); // default applied
  });
});
