const createError = require("../util/createError");
const jwt = require("jsonwebtoken");

const authorization = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (!decoded || !decoded.role || !allowedRoles.includes(decoded.role)) {
        return next(
          createError("You are not authorized to access this resource", 403, {
            code: "UNAUTHORIZED",
            details: { role: decoded ? decoded.role : null },
          })
        );
      }

      next();
    } catch (error) {
      next(
        createError("Authorization failed", 401, {
          code: "AUTHORIZATION_ERROR",
          details: { message: error.message },
        })
      );
    }
  };
};

module.exports = {
  authorization,
};
