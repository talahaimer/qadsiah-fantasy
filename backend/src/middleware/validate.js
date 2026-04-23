const ApiError = require('../utils/ApiError');

// Validate a Zod schema against req[part] and replace with parsed result.
module.exports = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    return next(ApiError.badRequest('Validation failed', result.error.flatten()));
  }
  req[part] = result.data;
  return next();
};
