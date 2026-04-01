const Joi = require("joi");

const buyItemSchema = Joi.object({
  shopItemId: Joi.number().integer().positive().required().messages({
    "any.required": "請提供商品 ID",
  }),
  quantity: Joi.number().integer().min(1).max(999).default(1),
});

const sellItemSchema = Joi.object({
  inventoryId: Joi.number().integer().positive().required().messages({
    "any.required": "請提供背包物品 ID",
  }),
  quantity: Joi.number().integer().min(1).default(1),
});

module.exports = { buyItemSchema, sellItemSchema };
