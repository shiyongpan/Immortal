const Joi = require("joi");

const startQuestSchema = Joi.object({
  questId: Joi.number().integer().positive().required().messages({
    "any.required": "請提供任務 ID",
  }),
});

const updateProgressSchema = Joi.object({
  playerQuestId: Joi.number().integer().positive().required(),
  progress: Joi.object().required().messages({
    "any.required": "請提供進度資料",
  }),
});

module.exports = { startQuestSchema, updateProgressSchema };
