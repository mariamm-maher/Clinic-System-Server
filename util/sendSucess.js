const sendSuccess = (
  res,
  statusCode = 200,
  message = "Success",
  { data = {}, code = null, details = null, status = "success" } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    status,
    message,
    code,
    details,
    data,
  });
};

module.exports = sendSuccess;
