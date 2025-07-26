const Joi = require("joi");

const patientSchema = Joi.object({
  generalInfo: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    age: Joi.number().integer().min(0).max(150).optional().messages({
      "number.base": "Age must be a number",
      "number.integer": "Age must be a whole number",
      "number.min": "Age cannot be negative",
      "number.max": "Age cannot exceed 150",
    }),
    dateOfBirth: Joi.date().max("now").optional().messages({
      "date.base": "Date of birth must be a valid date",
      "date.max": "Date of birth cannot be in the future",
    }),
    gender: Joi.string().valid("male", "female").required().messages({
      "any.only": "Gender must be either 'male' or 'female'",
      "any.required": "Gender is required",
    }),
    phone: Joi.string()
      .pattern(/^[0-9+\-\s()]+$/)
      .min(10)
      .max(20)
      .required()
      .messages({
        "string.pattern.base":
          "Phone number must contain only numbers, +, -, spaces, and parentheses",
        "string.min": "Phone number must be at least 10 characters long",
        "string.max": "Phone number cannot exceed 20 characters",
        "any.required": "Phone number is required",
      }),
    address: Joi.string().max(200).optional().allow("").messages({
      "string.max": "Address cannot exceed 200 characters",
    }),
  }).required(),
});

// Update schema for patient (all fields optional except those that shouldn't change)

module.exports = {
  patientSchema,
};
