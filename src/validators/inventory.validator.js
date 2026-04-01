const Joi = require("joi");

const useItemSchema = Joi.object({
  inventoryId: Joi.number().integer().positive().required().messages({
    "any.required": "請提供背包物品 ID",
  }),
});

const equipItemSchema = Joi.object({
  inventoryId: Joi.number().integer().positive().required().messages({
    "any.required": "請提供背包物品 ID",
  }),
});

const discardItemSchema = Joi.object({
  inventoryId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

module.exports = { useItemSchema, equipItemSchema, discardItemSchema };
