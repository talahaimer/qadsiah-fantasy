const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const BUDGET_CAP = 100;
const MIN_SQUAD = 5;
const MAX_SQUAD = 11;
const ALLOWED_FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];

const playerSlotSchema = z.object({
  playerId: z.string().uuid(),
  slotPosition: z.string().max(20).optional(),
  isCaptain: z.boolean().optional(),
});

const squadSchema = z.object({
  name: z.string().max(100).optional(),
  formation: z.string().refine((v) => ALLOWED_FORMATIONS.includes(v), 'Invalid formation'),
  players: z.array(playerSlotSchema).min(MIN_SQUAD).max(MAX_SQUAD),
});

async function validateSquad(players) {
  const ids = players.map((p) => p.playerId);
  if (new Set(ids).size !== ids.length) throw ApiError.badRequest('Duplicate players in squad');
  const captains = players.filter((p) => p.isCaptain).length;
  if (captains !== 1) throw ApiError.badRequest('Exactly one captain is required');

  const rosters = await prisma.player.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, fantasyValue: true },
  });
  if (rosters.length !== ids.length) throw ApiError.badRequest('One or more players are not active Qadsiah players');
  const total = rosters.reduce((s, p) => s + p.fantasyValue, 0);
  if (total > BUDGET_CAP) throw ApiError.badRequest(`Squad exceeds budget cap (${total}/${BUDGET_CAP})`);
  return { total, budgetCap: BUDGET_CAP };
}

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const squad = await prisma.squad.findFirst({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    include: { players: { include: { player: true } } },
  });
  res.json(squad);
}));

router.post('/', authRequired, validate(squadSchema), asyncHandler(async (req, res) => {
  await validateSquad(req.body.players);

  // Replace any existing squad (single active squad per user).
  const existing = await prisma.squad.findFirst({ where: { userId: req.user.id } });
  if (existing) await prisma.squad.delete({ where: { id: existing.id } });

  const squad = await prisma.squad.create({
    data: {
      userId: req.user.id,
      name: req.body.name || null,
      formation: req.body.formation,
      players: {
        create: req.body.players.map((p) => ({
          playerId: p.playerId,
          slotPosition: p.slotPosition || null,
          isCaptain: !!p.isCaptain,
        })),
      },
    },
    include: { players: { include: { player: true } } },
  });
  res.status(201).json(squad);
}));

router.patch('/', authRequired, validate(squadSchema), asyncHandler(async (req, res) => {
  await validateSquad(req.body.players);

  // Respect 1-hour pre-kickoff lock on upcoming matches.
  const upcoming = await prisma.match.findFirst({
    where: { status: 'scheduled', matchDate: { gt: new Date() } },
    orderBy: { matchDate: 'asc' },
  });
  if (upcoming) {
    const msUntil = new Date(upcoming.matchDate).getTime() - Date.now();
    if (msUntil < 3600_000) throw ApiError.forbidden('Squad is locked within 1 hour of kickoff');
  }

  const existing = await prisma.squad.findFirst({ where: { userId: req.user.id } });
  if (!existing) throw ApiError.notFound('No squad to update; create one first');

  const squad = await prisma.$transaction(async (tx) => {
    await tx.squadPlayer.deleteMany({ where: { squadId: existing.id } });
    await tx.squad.update({
      where: { id: existing.id },
      data: {
        name: req.body.name ?? existing.name,
        formation: req.body.formation,
        players: {
          create: req.body.players.map((p) => ({
            playerId: p.playerId,
            slotPosition: p.slotPosition || null,
            isCaptain: !!p.isCaptain,
          })),
        },
      },
    });
    return tx.squad.findUnique({
      where: { id: existing.id },
      include: { players: { include: { player: true } } },
    });
  });
  res.json(squad);
}));

router.get('/validate', authRequired, asyncHandler(async (req, res) => {
  const squad = await prisma.squad.findFirst({
    where: { userId: req.user.id },
    include: { players: { include: { player: true } } },
  });
  if (!squad) return res.json({ valid: false, reason: 'No squad' });
  try {
    const report = await validateSquad(
      squad.players.map((sp) => ({ playerId: sp.playerId, isCaptain: sp.isCaptain }))
    );
    res.json({ valid: true, ...report });
  } catch (e) {
    res.json({ valid: false, reason: e.message });
  }
}));

module.exports = router;
