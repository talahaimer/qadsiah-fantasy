const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
  }
  // Prisma known errors
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: { message: 'Unique constraint violation', details: err.meta } });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Record not found' } });
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({ error: { message: 'Internal server error' } });
};
