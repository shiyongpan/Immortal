const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "用戶名只能包含字母和數字",
    "string.min": "用戶名至少 3 個字元",
    "string.max": "用戶名最多 50 個字元",
    "any.required": "用戶名為必填項",
  }),
  email: Joi.string().email().max(100).required().messages({
    "string.email": "請輸入有效的郵箱地址",
    "any.required": "郵箱為必填項",
  }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.min": "密碼至少 6 個字元",
    "any.required": "密碼為必填項",
  }),
  displayName: Joi.string().max(50).optional(),
});

const loginSchema = Joi.object({
  login: Joi.string().required().messages({
    "any.required": "請輸入用戶名或郵箱",
  }),
  password: Joi.string().required().messages({
    "any.required": "密碼為必填項",
  }),
});

module.exports = { registerSchema, loginSchema };
