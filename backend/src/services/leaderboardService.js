const { redis } = require('../config/redis');
const prisma = require('../config/database');
const { weeklyKey } = require('../utils/dates');

const GLOBAL_KEY = 'leaderboard:global';
const weeklyRedisKey = (date = new Date()) => `leaderboard:weekly:${weeklyKey(date)}`;

async function addPoints(userId, delta, { weekly = true } = {}) {
  if (!delta) return;
  const pipeline = redis.pipeline();
  pipeline.zincrby(GLOBAL_KEY, delta, userId);
  if (weekly) pipeline.zincrby(weeklyRedisKey(), delta, userId);
  await pipeline.exec();
}

async function getRank(userId) {
  const [globalRank, weeklyRank, globalScore, weeklyScore] = await Promise.all([
    redis.zrevrank(GLOBAL_KEY, userId),
    redis.zrevrank(weeklyRedisKey(), userId),
    redis.zscore(GLOBAL_KEY, userId),
    redis.zscore(weeklyRedisKey(), userId),
  ]);
  return {
    global: { rank: globalRank == null ? null : globalRank + 1, points: Number(globalScore || 0) },
    weekly: { rank: weeklyRank == null ? null : weeklyRank + 1, points: Number(weeklyScore || 0) },
  };
}

async function topN(scope = 'global', { limit = 50, offset = 0 } = {}) {
  const key = scope === 'weekly' ? weeklyRedisKey() : GLOBAL_KEY;
  const flat = await redis.zrevrange(key, offset, offset + limit - 1, 'WITHSCORES');
  const rows = [];
  for (let i = 0; i < flat.length; i += 2) {
    rows.push({ userId: flat[i], points: Number(flat[i + 1]) });
  }
  if (!rows.length) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows.map((r, i) => ({
    rank: offset + i + 1,
    points: r.points,
    user: byId.get(r.userId) || { id: r.userId },
  }));
}

async function rebuildFromDatabase() {
  // Useful for cold starts / disaster recovery.
  const users = await prisma.user.findMany({
    select: { id: true, totalPoints: true, weeklyPoints: true },
  });
  const pipeline = redis.pipeline();
  pipeline.del(GLOBAL_KEY);
  pipeline.del(weeklyRedisKey());
  for (const u of users) {
    if (u.totalPoints) pipeline.zadd(GLOBAL_KEY, u.totalPoints, u.id);
    if (u.weeklyPoints) pipeline.zadd(weeklyRedisKey(), u.weeklyPoints, u.id);
  }
  await pipeline.exec();
}

module.exports = { addPoints, getRank, topN, rebuildFromDatabase, weeklyRedisKey, GLOBAL_KEY };
