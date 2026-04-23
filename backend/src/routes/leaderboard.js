const express = require('express');
const { z } = require('zod');
const { authRequired, authOptional } = require('../middleware/auth');
const { leaderboardLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');

const router = express.Router();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
}).passthrough();

router.get('/global', leaderboardLimiter, authOptional, validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const rows = await leaderboardService.topN('global', req.query);
  res.json({ scope: 'global', results: rows });
}));

router.get('/weekly', leaderboardLimiter, authOptional, validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const rows = await leaderboardService.topN('weekly', req.query);
  res.json({ scope: 'weekly', results: rows });
}));

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const rank = await leaderboardService.getRank(req.user.id);
  res.json(rank);
}));

module.exports = router;
