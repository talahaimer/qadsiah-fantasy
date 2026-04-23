const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis } = require('../config/redis');

function make(opts) {
  // Disable rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: opts.keyGenerator,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${opts.prefix}:`,
    }),
    message: { error: { message: 'Too many requests, please try again later.' } },
  });
}

const authLimiter = make({ prefix: 'auth', windowMs: 60_000, max: 10 });
const predictLimiter = make({
  prefix: 'predict',
  windowMs: 60_000,
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip,
});
const leaderboardLimiter = make({
  prefix: 'lb',
  windowMs: 60_000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
});
const globalLimiter = make({ prefix: 'global', windowMs: 60_000, max: 300 });

module.exports = { authLimiter, predictLimiter, leaderboardLimiter, globalLimiter };
