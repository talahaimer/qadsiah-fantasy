const prisma = require('../config/database');
const logger = require('../config/logger');
const sportApi = require('../services/sportApiService');
const { getIO } = require('../config/socket');

module.exports = async function syncMatchJob(job) {
  const { matchId } = job.data;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== 'live') return { skipped: true };

  const events = await sportApi.fetchMatchEvents(match);
  if (!events.length) return { events: 0 };

  // Map external player IDs to internal players.
  const externalIds = [...new Set(events.map((e) => e.externalPlayerId).filter(Boolean))];
  const players = externalIds.length
    ? await prisma.player.findMany({ where: { externalId: { in: externalIds } } })
    : [];
  const byExt = new Map(players.map((p) => [p.externalId, p.id]));

  let inserted = 0;
  for (const ev of events) {
    if (!ev.externalId) continue;
    try {
      const created = await prisma.matchEvent.create({
        data: {
          externalId: ev.externalId,
          matchId,
          playerId: ev.externalPlayerId ? byExt.get(ev.externalPlayerId) || null : null,
          eventType: ev.eventType,
          minute: ev.minute || null,
          isOwnGoal: !!ev.isOwnGoal,
          isPenalty: !!ev.isPenalty,
        },
        include: { player: true },
      });
      inserted += 1;
      try { getIO().to(`match:${matchId}`).emit('match_event', created); } catch (_e) {}
    } catch (err) {
      if (err.code !== 'P2002') logger.warn({ err }, 'syncMatchJob insert failed');
    }
  }

  return { events: inserted };
};
