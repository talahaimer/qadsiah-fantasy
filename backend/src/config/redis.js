const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

// Main client — used for generic key/value + sorted sets.
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('connect', () => logger.info('Redis connected'));

// Dedicated pub/sub clients (required for Socket.IO adapter + Bull).
const pubClient = redis.duplicate();
const subClient = redis.duplicate();

module.exports = { redis, pubClient, subClient };
