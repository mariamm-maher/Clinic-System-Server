// middleware/verifyToken.js
const createError = require("../util/createError");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Expecting format: "Bearer token"

  if (!token) return next(createError("Access token is required", 401));

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err)
      return next(
        createError("invalid access token", 403, {
          details: "Token is  expired or invalid",
        })
      );
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
