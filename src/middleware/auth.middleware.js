const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * JWT 驗證中間件
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "未提供認證 Token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token 無效或已過期" });
    }

    req.user = user; // { playerId, username }
    next();
  });
};

/**
 * 可選的驗證中間件 (Token 存在就驗證,不存在也可以繼續)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
