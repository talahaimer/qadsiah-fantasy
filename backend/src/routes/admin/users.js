const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/database');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const q = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'elite']).optional(),
}).passthrough();

router.get('/', validate(q, 'query'), asyncHandler(async (req, res) => {
  const { limit, offset, search, role, tier } = req.query;
  const where = {
    ...(role ? { role } : {}),
    ...(tier ? { tier } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { totalPoints: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true, email: true, username: true, displayName: true, role: true,
        tier: true, totalPoints: true, weeklyPoints: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ total, rows });
}));

module.exports = router;
