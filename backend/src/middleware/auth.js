const { verifyAccess } = require('../utils/tokens');
const ApiError = require('../utils/ApiError');

function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized('Missing bearer token'));
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role, username: payload.username };
    return next();
  } catch (_e) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role, username: payload.username };
  } catch (_e) {
    /* ignore */
  }
  return next();
}

module.exports = { authRequired, authOptional };
