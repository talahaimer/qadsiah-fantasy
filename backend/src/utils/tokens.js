const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES }
  );
}

function signRefreshToken(user, jti) {
  return jwt.sign(
    { sub: user.id, jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES }
  );
}

function verifyAccess(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiryToDate(expiresIn) {
  // supports e.g. '30d', '15m', '1h'
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return new Date(Date.now() + n * mult);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccess, verifyRefresh, hashToken, parseExpiryToDate };
