// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    success: false,
    status,
    message: err.message || "Internal Server Error",
    code: err.code || null,
    details: err.details || null,
  });
};

module.exports = errorHandler;
