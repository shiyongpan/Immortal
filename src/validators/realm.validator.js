const Joi = require("joi");

const addExpSchema = Joi.object({
  amount: Joi.number().integer().positive().max(1000000).required().messages({
    "number.positive": "經驗值必須大於 0",
    "any.required": "請提供經驗值",
  }),
});

const breakthroughSchema = Joi.object({
  useItem: Joi.boolean().default(false),
});

module.exports = { addExpSchema, breakthroughSchema };
