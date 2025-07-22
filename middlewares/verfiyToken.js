const jwt = require("jsonwebtoken");
exports.verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(401); // Token expired or invalid
    req.user = decoded.userId;
    next();
  });
};
