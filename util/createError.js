// utils/createError.js
const createError = (message, statusCode = 500, options = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
  error.isOperational = true;

  if (options.code) error.code = options.code;
  if (options.details) error.details = options.details;

  return error;
};

module.exports = createError;
