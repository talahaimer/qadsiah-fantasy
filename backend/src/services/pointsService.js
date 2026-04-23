const prisma = require('../config/database');
const leaderboardService = require('./leaderboardService');
const badgeService = require('./badgeService');
const logger = require('../config/logger');

// Base point values per spec §7.
const PREDICTION_POINTS = {
  exactScore: 50,
  correctResult: 20,
  correctScorer: 30,
  correctMotm: 25,
  perfectBonus: 200,
};

const SQUAD_POINTS = {
  goal: 10,
  assist: 8,
  motm: 15,
  cleanSheet: 15,
  captainGoalBonus: 10, // captain total = goal(10) + bonus(10) = 20
  redCard: -10,
  ownGoal: -5,
};

const TIER_MULTIPLIER = { bronze: 1, silver: 1.05, gold: 1.1, elite: 1.15 };

function streakMultiplier(streak) {
  if (streak >= 7) return 2;
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.25;
  return 1;
}

// Applies tier + premium modifiers to any awarded points.
function applyUserMultipliers(points, user) {
  const tier = TIER_MULTIPLIER[user.tier] || 1;
  const premium = user.isPremium ? 1.1 : 1;
  return Math.round(points * tier * premium);
}

/**
 * Score a resolved prediction against the final match state.
 */
function scorePrediction(prediction, match, firstScorerPlayerId, motmPlayerId) {
  let pts = 0;
  const parts = [];

  const actualResult =
    match.homeScore > match.awayScore ? 'home'
      : match.homeScore < match.awayScore ? 'away'
      : 'draw';

  const exactScore =
    prediction.predictedHomeScore === match.homeScore &&
    prediction.predictedAwayScore === match.awayScore;
  const correctResult = prediction.predictedResult === actualResult;
  const correctScorer =
    !!firstScorerPlayerId && prediction.predictedScorerId === firstScorerPlayerId;
  const correctMotm =
    !!motmPlayerId && prediction.predictedMotmId === motmPlayerId;

  if (exactScore) { pts += PREDICTION_POINTS.exactScore; parts.push('exactScore'); }
  if (correctResult) { pts += PREDICTION_POINTS.correctResult; parts.push('correctResult'); }
  if (correctScorer) { pts += PREDICTION_POINTS.correctScorer; parts.push('correctScorer'); }
  if (correctMotm) { pts += PREDICTION_POINTS.correctMotm; parts.push('correctMotm'); }

  if (exactScore && correctResult && correctScorer && correctMotm) {
    pts += PREDICTION_POINTS.perfectBonus;
    parts.push('perfect');
  }

  return { points: pts, parts };
}

/**
 * Compute squad points for a single user based on all events in a match.
 * Captain scoring gets the bonus.
 */
function scoreSquadForMatch(squadPlayers, matchEvents) {
  const byPlayer = new Map(squadPlayers.map((sp) => [sp.playerId, sp]));
  let pts = 0;
  const lines = [];

  for (const ev of matchEvents) {
    const sp = ev.playerId ? byPlayer.get(ev.playerId) : null;
    if (!sp) continue;
    switch (ev.eventType) {
      case 'goal': {
        let p = SQUAD_POINTS.goal;
        if (sp.isCaptain) p += SQUAD_POINTS.captainGoalBonus;
        pts += p;
        lines.push({ event: 'goal', playerId: ev.playerId, points: p });
        break;
      }
      case 'assist':
        pts += SQUAD_POINTS.assist;
        lines.push({ event: 'assist', playerId: ev.playerId, points: SQUAD_POINTS.assist });
        break;
      case 'motm':
        pts += SQUAD_POINTS.motm;
        lines.push({ event: 'motm', playerId: ev.playerId, points: SQUAD_POINTS.motm });
        break;
      case 'red_card':
        pts += SQUAD_POINTS.redCard;
        lines.push({ event: 'red_card', playerId: ev.playerId, points: SQUAD_POINTS.redCard });
        break;
      case 'own_goal':
        pts += SQUAD_POINTS.ownGoal;
        lines.push({ event: 'own_goal', playerId: ev.playerId, points: SQUAD_POINTS.ownGoal });
        break;
      case 'clean_sheet':
        // only applies to GK/DEF squad members
        if (sp.player && (sp.player.position === 'GK' || sp.player.position === 'DEF')) {
          pts += SQUAD_POINTS.cleanSheet;
          lines.push({ event: 'clean_sheet', playerId: ev.playerId, points: SQUAD_POINTS.cleanSheet });
        }
        break;
      default:
        break;
    }
  }

  return { points: pts, lines };
}

/**
 * Finalizes a match: scores every user's prediction + squad, updates DB + Redis leaderboard.
 * Designed to be safely re-runnable if needed.
 */
async function resolveMatch(matchId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { events: { orderBy: { minute: 'asc' } } },
  });
  if (!match) throw new Error(`Match not found: ${matchId}`);
  if (match.status !== 'completed') {
    logger.warn({ matchId, status: match.status }, 'resolveMatch called on non-completed match');
  }

  const firstGoal = match.events.find((e) => e.eventType === 'goal' && !e.isOwnGoal);
  const motmEvent = match.events.find((e) => e.eventType === 'motm');
  const firstScorerPlayerId = firstGoal?.playerId || null;
  const motmPlayerId = motmEvent?.playerId || null;

  // 1) Score predictions
  const predictions = await prisma.prediction.findMany({
    where: { matchId, isResolved: false },
    include: { user: true },
  });

  for (const pred of predictions) {
    const { points, parts } = scorePrediction(pred, match, firstScorerPlayerId, motmPlayerId);
    const streak = await getPredictionStreak(pred.userId);
    const multiplied = Math.round(points * streakMultiplier(streak));
    const final = applyUserMultipliers(multiplied, pred.user);

    await prisma.$transaction([
      prisma.prediction.update({
        where: { id: pred.id },
        data: { pointsEarned: final, isResolved: true },
      }),
      prisma.user.update({
        where: { id: pred.userId },
        data: {
          totalPoints: { increment: final },
          weeklyPoints: { increment: final },
        },
      }),
    ]);
    await leaderboardService.addPoints(pred.userId, final);
    await badgeService.evaluateAfterPrediction(pred.userId, { parts, matchId });
  }

  // 2) Score squads (current active squad of each user)
  const users = await prisma.user.findMany({
    select: { id: true, tier: true, isPremium: true, squads: { take: 1, orderBy: { updatedAt: 'desc' }, include: { players: { include: { player: true } } } } },
  });

  for (const u of users) {
    const squad = u.squads[0];
    if (!squad) continue;
    const { points } = scoreSquadForMatch(squad.players, match.events);
    if (!points) continue;
    const final = applyUserMultipliers(points, u);
    await prisma.user.update({
      where: { id: u.id },
      data: { totalPoints: { increment: final }, weeklyPoints: { increment: final } },
    });
    await leaderboardService.addPoints(u.id, final);
  }

  await badgeService.evaluateAfterMatch(matchId);

  return { matchId, ok: true };
}

async function getPredictionStreak(userId) {
  // Count consecutive resolved predictions where points_earned > 0, ordered by submittedAt desc.
  const recent = await prisma.prediction.findMany({
    where: { userId, isResolved: true },
    orderBy: { submittedAt: 'desc' },
    take: 20,
    select: { pointsEarned: true },
  });
  let streak = 0;
  for (const p of recent) {
    if (p.pointsEarned > 0) streak += 1; else break;
  }
  return streak;
}

module.exports = {
  scorePrediction,
  scoreSquadForMatch,
  resolveMatch,
  applyUserMultipliers,
  streakMultiplier,
  getPredictionStreak,
  PREDICTION_POINTS,
  SQUAD_POINTS,
};
