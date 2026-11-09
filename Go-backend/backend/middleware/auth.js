// JWT authentication middleware - verifies Bearer tokens and attaches user to request

const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'No token provided'));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    return next(createError(401, 'Invalid or expired token'));
  }
};

module.exports = auth;
