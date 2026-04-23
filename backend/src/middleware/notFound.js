const ApiError = require('../utils/ApiError');
module.exports = (_req, _res, next) => next(ApiError.notFound('Route not found'));
