const ApiError = require('../utils/ApiError');

module.exports = function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Admin only'));
  return next();
};
