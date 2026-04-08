/**
 * Joi 驗證中間件工廠
 * @param {import('joi').Schema} schema - Joi schema
 * @param {'body'|'query'|'params'} target - 驗證目標
 */
function validate(schema, target = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ error: "輸入驗證失敗", details: messages });
    }
    req[target] = value;
    next();
  };
}

module.exports = validate;
