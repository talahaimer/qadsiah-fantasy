const prisma = require('../config/database');
const logger = require('../config/logger');

async function award(userId, badgeKey) {
  const badge = await prisma.badge.findUnique({ where: { key: badgeKey } });
  if (!badge) return null;
  try {
    const ub = await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    if (badge.pointsReward) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: badge.pointsReward },
          weeklyPoints: { increment: badge.pointsReward },
        },
      });
    }
    return ub;
  } catch (e) {
    if (e.code === 'P2002') return null; // already awarded
    logger.error({ err: e, userId, badgeKey }, 'badge award failed');
    return null;
  }
}

async function evaluateAfterPrediction(userId, ctx) {
  const count = await prisma.prediction.count({ where: { userId } });
  if (count === 1) await award(userId, 'first_prediction');
  if (ctx?.parts?.includes('perfect')) await award(userId, 'perfect_prediction');
}

async function evaluateAfterMatch(_matchId) {
  // Placeholder for batch badges (e.g., top_10_weekly, squad_goal_x5) — Phase 2.
}

async function evaluateLoginStreak(userId, streak) {
  if (streak >= 7) await award(userId, 'login_streak_7');
}

module.exports = { award, evaluateAfterPrediction, evaluateAfterMatch, evaluateLoginStreak };
