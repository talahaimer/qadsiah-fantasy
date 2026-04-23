const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { predictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const LOCK_WINDOW_MS = 5 * 60 * 1000;

const predictionSchema = z.object({
  matchId: z.string().uuid(),
  predictedHomeScore: z.number().int().min(0).max(20),
  predictedAwayScore: z.number().int().min(0).max(20),
  predictedResult: z.enum(['home', 'away', 'draw']),
  predictedScorerId: z.string().uuid().optional(),
  predictedMotmId: z.string().uuid().optional(),
});

router.post(
  '/',
  authRequired,
  predictLimiter,
  validate(predictionSchema),
  asyncHandler(async (req, res) => {
    const { matchId } = req.body;
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw ApiError.notFound('Match not found');
    if (match.status !== 'scheduled') throw ApiError.badRequest('Match is not open for predictions');

    const lockAt = new Date(match.matchDate).getTime() - LOCK_WINDOW_MS;
    if (Date.now() >= lockAt || match.isPredictionLocked) {
      throw ApiError.forbidden('Predictions are locked for this match');
    }

    // server-side consistency: result must match score direction
    const { predictedHomeScore: h, predictedAwayScore: a, predictedResult } = req.body;
    const inferred = h > a ? 'home' : h < a ? 'away' : 'draw';
    if (inferred !== predictedResult) {
      throw ApiError.badRequest('predictedResult does not match predicted score');
    }

    const existing = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId: req.user.id, matchId } },
    });
    if (existing) throw ApiError.conflict('Prediction already submitted for this match');

    const prediction = await prisma.prediction.create({
      data: {
        userId: req.user.id,
        matchId,
        predictedHomeScore: h,
        predictedAwayScore: a,
        predictedResult,
        predictedScorerId: req.body.predictedScorerId || null,
        predictedMotmId: req.body.predictedMotmId || null,
      },
    });
    res.status(201).json(prediction);
  })
);

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const predictions = await prisma.prediction.findMany({
    where: { userId: req.user.id },
    orderBy: { submittedAt: 'desc' },
    include: { match: true },
    take: 50,
  });
  res.json(predictions);
}));

router.get('/:matchId', authRequired, asyncHandler(async (req, res) => {
  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: req.user.id, matchId: req.params.matchId } },
  });
  if (!prediction) throw ApiError.notFound('No prediction for this match');
  res.json(prediction);
}));

module.exports = router;
