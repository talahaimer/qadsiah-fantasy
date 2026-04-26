const express = require('express');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sportApi = require('../services/sportApiService');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const now = new Date();
  const [upcoming, completed] = await Promise.all([
    // Upcoming matches (including last 6 hours to show recent live)
    prisma.match.findMany({
      where: { matchDate: { gte: new Date(now.getTime() - 6 * 3600_000) } },
      orderBy: { matchDate: 'asc' },
      take: 50,
    }),
    // Past completed matches (last 30 days)
    prisma.match.findMany({
      where: { 
        status: 'completed',
        matchDate: { lt: new Date(now.getTime() - 6 * 3600_000) }
      },
      orderBy: { matchDate: 'desc' },
      take: 30,
    })
  ]);
  
  // Combine and sort by date (upcoming first, then past)
  const allMatches = [...upcoming, ...completed];
  res.json(allMatches);
}));

router.get('/live', asyncHandler(async (_req, res) => {
  const live = await prisma.match.findMany({
    where: { status: 'live' },
    orderBy: { matchDate: 'asc' },
    include: { events: { orderBy: { minute: 'asc' } } },
  });
  res.json(live);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: { events: { orderBy: { minute: 'asc' }, include: { player: true } } },
  });
  if (!match) throw ApiError.notFound('Match not found');
  res.json(match);
}));

router.get('/:id/events', asyncHandler(async (req, res) => {
  const events = await prisma.matchEvent.findMany({
    where: { matchId: req.params.id },
    include: { player: true },
    orderBy: { minute: 'asc' },
  });
  res.json(events);
}));

router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id }
  });
  if (!match) throw ApiError.notFound('Match not found');
  
  if (!match.externalId) {
    return res.json({ message: 'No external ID available for statistics' });
  }
  
  const stats = await sportApi.fetchMatchStatistics(match.externalId);
  res.json(stats || {});
}));

router.get('/:id/lineups', asyncHandler(async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id }
  });
  if (!match) throw ApiError.notFound('Match not found');
  
  if (!match.externalId) {
    return res.json({ message: 'No external ID available for lineups' });
  }
  
  const lineups = await sportApi.fetchMatchLineups(match.externalId);
  res.json(lineups || {});
}));

router.get('/external/live', asyncHandler(async (_req, res) => {
  const liveMatches = await sportApi.fetchLiveMatches();
  res.json(liveMatches);
}));

module.exports = router;
