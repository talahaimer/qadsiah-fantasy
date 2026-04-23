const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');

const router = express.Router();

const updateSchema = z.object({
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  language: z.enum(['ar', 'en']).optional(),
  phone: z.string().max(20).optional(),
  firstname: z.string().max(50).optional(),
  lastname: z.string().max(50).optional(),
  expoPushToken: z.string().max(200).optional(),
}).strict();

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).end();
  const rank = await leaderboardService.getRank(user.id);
  const { passwordHash, ...safe } = user;
  res.json({ ...safe, rank });
}));

router.patch('/me', authRequired, validate(updateSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
  });
  const { passwordHash, ...safe } = user;
  res.json(safe);
}));

router.get('/me/badges', authRequired, asyncHandler(async (req, res) => {
  const badges = await prisma.userBadge.findMany({
    where: { userId: req.user.id },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });
  res.json(badges);
}));

router.get('/me/history', authRequired, asyncHandler(async (req, res) => {
  const predictions = await prisma.prediction.findMany({
    where: { userId: req.user.id, isResolved: true },
    include: { match: true },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  });
  res.json(predictions);
}));

module.exports = router;
