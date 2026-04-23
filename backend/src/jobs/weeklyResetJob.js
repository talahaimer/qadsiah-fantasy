const prisma = require('../config/database');
const { redis } = require('../config/redis');
const { weeklyRedisKey } = require('../services/leaderboardService');
const { getIsoWeek } = require('../utils/dates');
const logger = require('../config/logger');

module.exports = async function weeklyResetJob() {
  // Snapshot the current weekly leaderboard before resetting.
  const key = weeklyRedisKey();
  const flat = await redis.zrevrange(key, 0, 999, 'WITHSCORES');
  const { year, week } = getIsoWeek();
  const rows = [];
  for (let i = 0; i < flat.length; i += 2) {
    rows.push({ userId: flat[i], points: Number(flat[i + 1]), rank: rows.length + 1 });
  }
  if (rows.length) {
    await prisma.leaderboardSnapshot.createMany({
      data: rows.map((r) => ({ userId: r.userId, weekNumber: week, year, points: r.points, rank: r.rank })),
    });
  }
  // Reset weeklyPoints for all users + delete current week key.
  await prisma.user.updateMany({ data: { weeklyPoints: 0 } });
  await redis.del(key);
  logger.info({ snapshotted: rows.length, week, year }, 'weekly reset complete');
  return { snapshotted: rows.length };
};
