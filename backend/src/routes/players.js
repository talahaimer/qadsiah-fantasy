const express = require('express');
const prisma = require('../config/database');
const { redis } = require('../config/redis');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const CACHE_KEY = 'cache:players';
const TTL = 3600;

router.get('/', asyncHandler(async (_req, res) => {
  const cached = await redis.get(CACHE_KEY);
  if (cached) return res.json(JSON.parse(cached));
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { jerseyNumber: 'asc' }],
  });
  await redis.set(CACHE_KEY, JSON.stringify(players), 'EX', TTL);
  res.json(players);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const player = await prisma.player.findUnique({ where: { id: req.params.id } });
  if (!player) throw ApiError.notFound('Player not found');
  res.json(player);
}));

module.exports = router;
