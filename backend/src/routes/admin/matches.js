const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/database');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { getIO } = require('../../config/socket');
const pointsService = require('../../services/pointsService');
const { queues } = require('../../config/queue');

const router = express.Router();

const createMatch = z.object({
  externalId: z.string().max(50).optional(),
  homeTeam: z.string().min(1).max(100),
  awayTeam: z.string().min(1).max(100),
  matchDate: z.coerce.date(),
  venue: z.string().max(100).optional(),
  competition: z.string().max(100).optional(),
  season: z.string().max(10).optional(),
});

const updateMatch = z.object({
  homeTeam: z.string().optional(),
  awayTeam: z.string().optional(),
  matchDate: z.coerce.date().optional(),
  venue: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
  homeScore: z.number().int().min(0).max(50).optional(),
  awayScore: z.number().int().min(0).max(50).optional(),
  isPredictionLocked: z.boolean().optional(),
  competition: z.string().optional(),
  season: z.string().optional(),
});

const eventSchema = z.object({
  playerId: z.string().uuid().optional(),
  eventType: z.enum(['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'clean_sheet', 'own_goal', 'penalty_miss', 'motm']),
  minute: z.number().int().min(0).max(130).optional(),
  isOwnGoal: z.boolean().optional(),
  isPenalty: z.boolean().optional(),
  externalId: z.string().optional(),
});

router.post('/', validate(createMatch), asyncHandler(async (req, res) => {
  const match = await prisma.match.create({ data: req.body });
  res.status(201).json(match);
}));

router.patch('/:id', validate(updateMatch), asyncHandler(async (req, res) => {
  const previous = await prisma.match.findUnique({ where: { id: req.params.id } });
  if (!previous) throw ApiError.notFound('Match not found');
  const match = await prisma.match.update({ where: { id: req.params.id }, data: req.body });

  // Broadcast status/score change
  try { getIO().to(`match:${match.id}`).emit('match_update', match); } catch (_e) {}

  // Transition side-effects
  if (previous.status !== 'live' && match.status === 'live') {
    await queues.matchSync.add({ matchId: match.id }, { repeat: { every: 30_000 }, jobId: `sync-${match.id}` });
  }
  if (previous.status !== 'completed' && match.status === 'completed') {
    // stop live sync
    const repeatable = await queues.matchSync.getRepeatableJobs();
    for (const r of repeatable) {
      if (r.id === `sync-${match.id}`) await queues.matchSync.removeRepeatableByKey(r.key);
    }
    // resolve points asynchronously
    await queues.pointsCalc.add({ matchId: match.id });
  }

  res.json(match);
}));

router.post('/:id/events', validate(eventSchema), asyncHandler(async (req, res) => {
  const match = await prisma.match.findUnique({ where: { id: req.params.id } });
  if (!match) throw ApiError.notFound('Match not found');
  const event = await prisma.matchEvent.create({
    data: { ...req.body, matchId: match.id },
    include: { player: true },
  });
  try { getIO().to(`match:${match.id}`).emit('match_event', event); } catch (_e) {}
  res.status(201).json(event);
}));

router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const result = await pointsService.resolveMatch(req.params.id);
  res.json(result);
}));

module.exports = router;
