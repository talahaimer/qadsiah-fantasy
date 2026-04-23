const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/database');
const { redis } = require('../../config/redis');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const createSchema = z.object({
  externalId: z.string().max(50).optional(),
  nameEn: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  photoUrl: z.string().url().optional(),
  fantasyValue: z.number().int().min(1).max(50).default(10),
  isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const player = await prisma.player.create({ data: req.body });
  await redis.del('cache:players');
  res.status(201).json(player);
}));

router.patch('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const player = await prisma.player.update({ where: { id: req.params.id }, data: req.body });
  await redis.del('cache:players');
  res.json(player);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.player.update({ where: { id: req.params.id }, data: { isActive: false } });
  await redis.del('cache:players');
  res.status(204).end();
}));

module.exports = router;
