const Joi = require("joi");

const startBattleSchema = Joi.object({
  monsterId: Joi.number().integer().positive().required().messages({
    "number.base": "怪物 ID 必須為數字",
    "number.positive": "怪物 ID 必須為正整數",
    "any.required": "請提供怪物 ID",
  }),
});

const getBattleLogsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
});

module.exports = { startBattleSchema, getBattleLogsSchema };
