const Joi = require("joi");

const bookingSchema = Joi.object({
  patientId: Joi.string().optional().allow(null),
  patientName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Patient name must be at least 2 characters long",
    "string.max": "Patient name cannot exceed 100 characters",
    "any.required": "Patient name is required",
  }),
  patientPhone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must contain only numbers, +, -, spaces, and parentheses",
      "string.min": "Phone number must be at least 10 characters long",
      "string.max": "Phone number cannot exceed 20 characters",
      "any.required": "Patient phone is required",
    }),
  day: Joi.string()
    .valid(
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    )
    .required()
    .messages({
      "any.only":
        "Day must be one of: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday",
      "any.required": "Day is required",
    }),
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Time must be in HH:MM format (24-hour)",
      "any.required": "Time is required",
    }),
  createdFrom: Joi.string()
    .valid("clinic", "phone", "website")
    .required()
    .messages({
      "any.only": "Created from must be one of: clinic, phone, website",
      "any.required": "Created from is required",
    }),
  status: Joi.string()
    .valid("pending", "confirmed", "canceled", "done")
    .optional()
    .default("pending")
    .messages({
      "any.only": "Status must be one of: pending, confirmed, canceled, done",
    }),
  notes: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
  createdBy: Joi.string().optional().allow(null),
});

const updateBookingSchema = Joi.object({
  patientId: Joi.string().optional().allow(null),
  patientName: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Patient name must be at least 2 characters long",
    "string.max": "Patient name cannot exceed 100 characters",
  }),
  patientPhone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(20)
    .optional()
    .messages({
      "string.pattern.base":
        "Phone number must contain only numbers, +, -, spaces, and parentheses",
      "string.min": "Phone number must be at least 10 characters long",
      "string.max": "Phone number cannot exceed 20 characters",
    }),
  day: Joi.string()
    .valid(
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    )
    .optional()
    .messages({
      "any.only":
        "Day must be one of: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday",
    }),
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "Time must be in HH:MM format (24-hour)",
    }),
  createdFrom: Joi.string()
    .valid("clinic", "phone", "website")
    .optional()
    .messages({
      "any.only": "Created from must be one of: clinic, phone, website",
    }),
  status: Joi.string()
    .valid("pending", "confirmed", "canceled", "done")
    .optional()
    .messages({
      "any.only": "Status must be one of: pending, confirmed, canceled, done",
    }),
  notes: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
  createdBy: Joi.string().optional().allow(null),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

module.exports = {
  bookingSchema,
  updateBookingSchema,
};
