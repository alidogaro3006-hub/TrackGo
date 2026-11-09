// Role-based access control middleware factory - restricts routes to specific user roles

const createError = require('../utils/createError');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(createError(403, 'Insufficient permissions'));
    }
    next();
  };
};

module.exports = requireRole;
