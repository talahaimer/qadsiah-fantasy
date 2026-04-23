# Qadsiah Fantasy — Backend API

Express.js + Prisma + PostgreSQL + Redis + Socket.IO + Bull.

See `/Volumes/Dev/qadisiya/development.md` for the full spec. This backend implements sections 2–12.

## Quick start

```bash
cp .env.example .env
# edit DATABASE_URL, REDIS_URL, JWT secrets, API_FOOTBALL_KEY, etc.

npm install
npm run prisma:generate
npm run prisma:migrate       # creates DB schema
npm run seed                 # admin user, badges, Qadsiah roster
npm run dev                  # http://localhost:4000
```

### API-Football Setup

1. Get an API key from [API-Football](https://www.api-football.com/)
2. Add it to your `.env` file:
   ```
   API_FOOTBALL_KEY=your_api_key_here
   SPORT_API_PROVIDER=api_football
   ```
3. Test the integration:
   ```bash
   node test-api-football.js
   ```

The live scoring system will automatically:
- Fetch live matches every 30 seconds
- Update match scores and events in real-time
- Broadcast updates via Socket.IO to connected clients
- Store match events for fantasy scoring calculations

Health check: `GET /health`

## Tech

- **Runtime:** Node.js 18+ (uses global `fetch`)
- **Framework:** Express 4
- **ORM:** Prisma (PostgreSQL)
- **Cache / Rank / Pub-Sub:** Redis (via ioredis)
- **Real-time:** Socket.IO with Redis adapter
- **Queue:** Bull — match sync (30s polling), points calc, weekly reset
- **Auth:** JWT (access 15m + refresh 30d, server-side revocable)
- **Validation:** Zod
- **Security:** Helmet, CORS allowlist, bcrypt(12), Redis-backed rate limiting

## Project structure

```
src/
├── app.js                  # HTTP + Socket.IO bootstrap
├── config/                 # env, database, redis, socket, queue, logger
├── middleware/             # auth, requireAdmin, validate, errorHandler, rateLimiter
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── players.js
│   ├── squad.js
│   ├── matches.js
│   ├── predictions.js
│   ├── leaderboard.js
│   └── admin/              # matches, players, users, sync
├── services/               # points, leaderboard, badge, sportApi, notification
├── jobs/                   # Bull processors
├── socket/handlers.js
└── utils/                  # ApiError, tokens, dates, asyncHandler
prisma/
├── schema.prisma
└── seed.js
```

## API base

All routes are mounted at `/api/v1`. See `development.md` §5 for the full endpoint list.

## Ports (per spec)

- Backend: **4000**
- Web: 3000 · Admin: 3001 · Mobile dev: 3002

## Key design choices

- **Leaderboards served exclusively from Redis** sorted sets (`leaderboard:global`, `leaderboard:weekly:{YYYY-Www}`). PostgreSQL holds authoritative totals so Redis can be rebuilt (`leaderboardService.rebuildFromDatabase()`).
- **Prediction lock** is enforced server-side at `match.match_date - 5 min`. `predictedResult` must match the predicted score direction.
- **Squad lock** rejects updates within 1 hour of the next kickoff.
- **Captain scoring** adds +10 to a captain's goal (10 base + 10 bonus = 20).
- **Streak + tier + premium multipliers** are applied when resolving predictions in `pointsService.resolveMatch`.
- **Admin transitions** `scheduled → live` schedule a repeatable Bull job; `live → completed` removes it and enqueues points calc.

## Next steps (not yet implemented)

- Password reset email flow (Mailjet integration)
- Friends leaderboards
- In-match micro-challenges
- Audit log writes from admin routes
- Unit/integration test suite under `tests/`
