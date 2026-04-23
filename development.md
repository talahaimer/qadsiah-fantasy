# Qadsiah Fantasy Fan Platform — Developer Specification

> **Concept:** Fantasy football + live match predictions + fan progression system
> Built exclusively around **Al-Qadsiah FC** — real players, real matches, real rewards.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Core Features — Detailed Specs](#6-core-features--detailed-specs)
7. [Scoring System](#7-scoring-system)
8. [Real-Time Engine](#8-real-time-engine)
9. [Gamification Layer](#9-gamification-layer)
10. [Monetization](#10-monetization)
11. [Security & Anti-Cheat](#11-security--anti-cheat)
12. [Performance Strategy](#12-performance-strategy)
13. [External Integrations](#13-external-integrations)
14. [Implementation Phases](#14-implementation-phases)
15. [Environment Variables](#15-environment-variables)
16. [Folder Structure](#16-folder-structure)

---

## 1. Project Overview

### What It Is
A gamified fan engagement platform where Qadsiah supporters:
- Build a virtual squad from real Qadsiah players
- Predict match events before kickoff
- Earn points from real-life match outcomes
- Climb leaderboards and unlock badges/tiers

### Target Users
- Qadsiah FC fans (primary market: Saudi Arabia)
- Arabic + English support (full RTL for Arabic)

### Platform Components

| Component | Technology | Description |
|---|---|---|
| Mobile App | Expo (React Native) | Fan-facing iOS + Android app |
| Web App | Next.js (JavaScript) | Browser version of fan app |
| Admin Dashboard | Next.js (JavaScript) | Internal ops, match management |
| Backend API | Express.js | REST + Socket.IO |
| Database | PostgreSQL | Persistent data store |
| Cache / Realtime | Redis | Leaderboard caching, pub/sub |

---

## 2. Tech Stack

### Frontend — Mobile
```
Framework:      Expo (React Native)
State:          Zustand (preferred) or Redux Toolkit
UI:             NativeWind or Tamagui
Navigation:     Expo Router
Push Notifs:    Expo Notifications
i18n:           i18next + react-i18next
```

### Frontend — Web
```
Framework:      Next.js (JavaScript — NO TypeScript)
UI:             NativeWind or Tamagui
State:          Zustand
Data Fetching:  SWR or React Query
Real-Time:      Socket.IO Client
i18n:           next-i18next
```
### Frontend — Admin
```
Framework:      Next.js (JavaScript — NO TypeScript)
UI:             NativeWind or Tamagui
State:          Zustand
Data Fetching:  SWR or React Query
Real-Time:      Socket.IO Client
i18n:           next-i18next
```

### Backend
```
Runtime:        Node.js
Framework:      Express.js
Real-Time:      Socket.IO
Auth:           JWT (access + refresh tokens)
Validation:     Zod or Joi
ORM:            Prisma or Drizzle
Job Queue:      Bull (Redis-backed) — for match sync jobs
```

### Infrastructure
```
Database:       PostgreSQL
Cache:          Redis
File Storage:   unsigned Cloudinary
Hosting:        Railway / Render / AWS (your choice)
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  [Mobile App (Expo)]  [Web App (Next.js)]  [Admin (Next.js)]│
└──────────────────┬──────────────────────────────────────────┘
                   │  REST + Socket.IO
┌──────────────────▼──────────────────────────────────────────┐
│                    Express.js API                            │
│   ┌──────────┐  ┌─────────────┐  ┌────────────────────┐    │
│   │  Auth    │  │  Core REST  │  │  Socket.IO Server  │    │
│   │  Routes  │  │  Routes     │  │  (Live Events)     │    │
│   └──────────┘  └─────────────┘  └────────────────────┘    │
│                        │                                     │
│   ┌────────────────────▼────────────────────────────────┐   │
│   │               Bull Job Queue                        │   │
│   │   - Match sync jobs (poll external API)             │   │
│   │   - Points calculation jobs                         │   │
│   │   - Notification dispatch jobs                      │   │
│   └────────────────────────────────────────────────────-┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
     ┌──────────▼──────────┐
     │    PostgreSQL DB     │  ← Primary data store
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │       Redis          │  ← Cache + Leaderboard + Pub/Sub
     └─────────────────────┘
                │
     ┌──────────▼──────────┐
     │  External Sport API  │  ← SportMonks / API-Football
     └─────────────────────┘
```

### Real-Time Event Flow
```
External API (poll/webhook)
       ↓
  Bull Job Queue
       ↓
  Process Event (goal, assist, card, etc.)
       ↓
  Update PostgreSQL (match_events table)
       ↓
  Recalculate affected user points
       ↓
  Update Redis leaderboard (ZADD)
       ↓
  Emit via Socket.IO to all connected clients
       ↓
  App UI updates instantly
```

---

## 4. Database Schema

### Users
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  firstname       VARCHAR(50),
  lastname        VARCHAR(50),
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  language        VARCHAR(5) DEFAULT 'ar',       -- 'ar' | 'en'
  tier            VARCHAR(20) DEFAULT 'bronze',   -- bronze | silver | gold | elite
  total_points    INTEGER DEFAULT 0,
  weekly_points   INTEGER DEFAULT 0,
  login_streak    INTEGER DEFAULT 0,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Players
```sql
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     VARCHAR(50) UNIQUE,             -- ID from sport API
  name_en         VARCHAR(100) NOT NULL,
  name_ar         VARCHAR(100),
  position        VARCHAR(20),                    -- GK | DEF | MID | FWD
  jersey_number   INTEGER,
  photo_url       TEXT,
  fantasy_value   INTEGER DEFAULT 10,             -- budget cost in fantasy coins
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Squads
```sql
CREATE TABLE squads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100),
  formation       VARCHAR(10) DEFAULT '4-3-3',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE squad_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id        UUID REFERENCES squads(id) ON DELETE CASCADE,
  player_id       UUID REFERENCES players(id),
  slot_position   VARCHAR(20),                    -- e.g. GK, CB1, LW
  is_captain      BOOLEAN DEFAULT FALSE,
  UNIQUE(squad_id, player_id)
);
```

### Matches
```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     VARCHAR(50) UNIQUE,
  home_team       VARCHAR(100),
  away_team       VARCHAR(100),
  match_date      TIMESTAMP NOT NULL,
  venue           VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'scheduled', -- scheduled | live | completed | cancelled
  home_score      INTEGER DEFAULT 0,
  away_score      INTEGER DEFAULT 0,
  competition     VARCHAR(100),
  season          VARCHAR(10),
  is_prediction_locked BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Match Events
```sql
CREATE TABLE match_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id),
  player_id       UUID REFERENCES players(id),
  event_type      VARCHAR(30),    -- goal | assist | yellow_card | red_card | substitution | clean_sheet
  minute          INTEGER,
  is_own_goal     BOOLEAN DEFAULT FALSE,
  is_penalty      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Predictions
```sql
CREATE TABLE predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  match_id        UUID REFERENCES matches(id),
  predicted_home_score  INTEGER,
  predicted_away_score  INTEGER,
  predicted_scorer_id   UUID REFERENCES players(id),   -- first goal scorer
  predicted_motm_id     UUID REFERENCES players(id),   -- man of the match
  predicted_result      VARCHAR(10),                    -- home | away | draw
  points_earned         INTEGER DEFAULT 0,
  is_resolved           BOOLEAN DEFAULT FALSE,
  submitted_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
```

### Leaderboard Snapshots (for historical weekly data)
```sql
CREATE TABLE leaderboard_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  week_number     INTEGER,
  year            INTEGER,
  points          INTEGER,
  rank            INTEGER,
  snapshot_at     TIMESTAMP DEFAULT NOW()
);
```

### Badges
```sql
CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             VARCHAR(50) UNIQUE NOT NULL,    -- e.g. 'first_prediction', 'hot_streak_5'
  name_en         VARCHAR(100),
  name_ar         VARCHAR(100),
  description_en  TEXT,
  description_ar  TEXT,
  icon_url        TEXT,
  points_reward   INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  badge_id        UUID REFERENCES badges(id),
  earned_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```


## 5. API Design

### Base URL
```
/api/v1
```

### Auth Endpoints
```
POST   /auth/register           Register new user
POST   /auth/login              Login, returns JWT pair
POST   /auth/refresh            Refresh access token
POST   /auth/logout             Invalidate refresh token
POST   /auth/forgot-password    Send reset email
POST   /auth/reset-password     Reset with token
```

### User Endpoints
```
GET    /users/me                Get own profile
PATCH  /users/me                Update profile
GET    /users/me/badges         Get earned badges
GET    /users/me/history        Points/prediction history
```

### Player Endpoints
```
GET    /players                 List all active Qadsiah players
GET    /players/:id             Get single player
```

### Squad Endpoints
```
GET    /squad                   Get user's current squad
POST   /squad                   Create/replace squad
PATCH  /squad                   Update squad (swap players)
GET    /squad/validate          Validate squad (budget, size)
```

### Match Endpoints
```
GET    /matches                 List upcoming + recent matches
GET    /matches/:id             Get match detail + events
GET    /matches/:id/events      Live events for a match
GET    /matches/live            Currently live matches
```

### Prediction Endpoints
```
POST   /predictions             Submit prediction (pre-kickoff only)
GET    /predictions/me          My predictions list
GET    /predictions/:matchId    My prediction for specific match
```

### Leaderboard Endpoints
```
GET    /leaderboard/global      Top 100 all-time
GET    /leaderboard/weekly      Top 100 this week
GET    /leaderboard/me          My rank (global + weekly)
```

### Admin Endpoints (protected by admin role)
```
POST   /admin/matches           Create match
PATCH  /admin/matches/:id       Update match status/scores
POST   /admin/matches/:id/events   Add match event manually
POST   /admin/players           Add player
PATCH  /admin/players/:id       Update player
POST   /admin/sync/match/:id    Trigger manual sync from sport API
GET    /admin/users             List users with filters
```

---

## 6. Core Features — Detailed Specs

### 6.1 Authentication
- JWT-based: short-lived access token (15 min) + long-lived refresh token (30 days)
- Refresh token stored in `httpOnly` cookie (web) or SecureStore (mobile)
- Password hashing: bcrypt (rounds: 12)
- Rate limiting: 5 failed login attempts → 15-minute lockout

### 6.2 Fantasy Squad
- User selects **5–11 players** from the active Qadsiah roster
- Optional: **Budget system** — each player has a `fantasy_value`, total squad cost must be ≤ budget cap (e.g. 100 coins)
- Formation support: 4-3-3, 4-4-2, 3-5-2, 5-3-2
- One captain designation (captain earns **2× points** from squad events)
- Squad can be updated **until 1 hour before match kickoff** — then locked
- Squad lock is enforced server-side (never trust client)

### 6.3 Match Predictions
Users submit before kickoff:

| Field | Type | Description |
|---|---|---|
| Final Score | Integer pair | e.g. Qadsiah 2 – 1 AlHilal |
| Winner | Enum | home / away / draw |
| First Goal Scorer | Player ID | From Qadsiah squad |
| Man of the Match | Player ID | From Qadsiah squad |

**Rules:**
- Predictions lock at `match.match_date - 5 minutes`
- One prediction per user per match
- Server validates lock time on submission
- Predictions are not editable once submitted

### 6.4 Live Sync Engine
- **Primary:** Poll external sport API every 30 seconds during live matches (Bull repeatable job)
- **Fallback:** Manual event entry via Admin Dashboard
- On each poll:
  1. Compare incoming events against stored `match_events`
  2. Insert new events only (idempotent by `external_id`)
  3. Trigger `points-calculation` job for affected users
  4. Emit `match_event` via Socket.IO to room `match:{matchId}`
- Polling only runs when `match.status = 'live'`

### 6.5 Leaderboard
- **Global:** All-time total points — sorted via Redis sorted set `leaderboard:global`
- **Weekly:** Resets every Monday 00:00 UTC — Redis sorted set `leaderboard:weekly:{YYYY-WW}`
- **Friends:** (Phase 2) — user-defined group leaderboards
- Leaderboard Redis keys updated immediately after points calculation
- Pagination: cursor-based, page size 50

---

## 7. Scoring System

### Prediction Points

| Prediction Outcome | Points |
|---|---|
| Exact final score | +50 |
| Correct result (win/draw/loss) | +20 |
| Correct first goal scorer | +30 |
| Correct Man of the Match | +25 |
| All 4 correct (perfect prediction) | **+200 (bonus)** |

### Squad Points (from real match events)

| Event | Points |
|---|---|
| Squad player scores a goal | +10 |
| Squad player provides an assist | +8 |
| Squad player earns Man of the Match | +15 |
| Defender/GK in squad — clean sheet | +15 |
| Captain scores a goal | +20 (2×) |
| Squad player receives red card | −10 |

### Bonus Multipliers

| Trigger | Multiplier |
|---|---|
| 3-match prediction streak | 1.25× prediction points |
| 5-match prediction streak | 1.5× prediction points |
| 7+ match prediction streak | 2× prediction points |
| Premium user | 1.1× all points |

**Design Rule:** Points must feel achievable every match. Even a partially correct prediction should reward the user.

---

## 8. Real-Time Engine

### Socket.IO Rooms
```
match:{matchId}         All clients watching a specific match
user:{userId}           Private channel for personal notifications
leaderboard:global      Leaderboard watchers (throttled updates)
```


## 9. Gamification Layer

### Tier System

| Tier | Points Required | Perks |
|---|---|---|
| Bronze | 0 – 499 | Standard access |
| Silver | 500 – 1,499 | +5% bonus points |
| Gold | 1,500 – 3,999 | +10% bonus, exclusive badge frame |
| Elite | 4,000+ | +15% bonus, Elite badge, priority leaderboard |

### Badges Catalog (Seed Data)

| Key | Trigger | Name (EN) |
|---|---|---|
| `first_prediction` | Submit first prediction | Prophet |
| `perfect_prediction` | All 4 fields correct in one match | Oracle |
| `hot_streak_3` | 3-match prediction streak | On Fire |
| `hot_streak_7` | 7-match prediction streak | Unstoppable |
| `squad_goal_x5` | Squad players score 5+ goals | Goal Factory |
| `top_10_weekly` | Finish in weekly top 10 | Elite Fan |
| `login_streak_7` | 7 consecutive daily logins | Loyal Supporter |
| `clean_sheet_bonus` | Predict clean sheet correctly | Iron Wall |

### Daily Login Rewards

| Day Streak | Reward |
|---|---|
| Day 1 | +10 pts |
| Day 3 | +25 pts |
| Day 7 | +75 pts + badge |
| Day 14 | +150 pts |
| Day 30 | +500 pts + exclusive badge |

Streak resets if user misses a calendar day.

### Challenges (Phase 2)
- Time-limited challenges during live matches: "Predict the next goal scorer" (30-second window)
- Weekly challenges: "Get 3 predictions correct this week" → bonus reward
- Seasonal challenges: End-of-season "Fantasy Champion" badge

---

## 11. Security & Anti-Cheat

### Prediction Locking (Critical)

Never rely on client-side lock — always validate on server.

### Input Validation
- All request bodies validated with Zod schemas
- Player IDs validated against active Qadsiah roster
- Score values: integers, 0–20 range only

### Rate Limiting
```
/auth/*        → 10 req/min per IP
/predictions   → 5 req/min per user
/leaderboard   → 30 req/min per user
Socket.IO      → max 100 events/min per connection
```

### JWT Security
- Access token: 15-minute expiry, signed with RS256
- Refresh token: 30-day expiry, stored server-side in Redis (revocable)
- Token rotation on every refresh
- Logout invalidates refresh token immediately

### Admin Role Protection
- Admin routes behind `requireAdmin` middleware
- Admin actions logged to audit table
- Match event creation requires admin JWT

---

## 12. Performance Strategy

### PostgreSQL
- Connection pooling: PgBouncer (max 100 connections)
- Indexes on all foreign keys and frequently queried columns (see schema)
- Partition `leaderboard_snapshots` by year if needed

### Redis Usage
```
leaderboard:global           ZADD/ZREVRANK — sorted set by total_points
leaderboard:weekly:{YYYY-WW} ZADD/ZREVRANK — reset weekly
session:{userId}             Refresh token storage (TTL: 30d)
match:live:{matchId}         Live match state (TTL: 6h post-match)
cache:players                Full player list (TTL: 1h)
cache:match:{id}             Match detail (TTL: 60s during live, 5min otherwise)
```

### Caching Strategy
- Player list: cached in Redis for 1 hour (changes rarely)
- Leaderboard reads: serve from Redis only, never hit PostgreSQL for rank queries
- Match data during live: 30-second cache invalidation
- Use `stale-while-revalidate` pattern on web frontend (SWR)

### Socket.IO Scaling (when needed)
- Use `@socket.io/redis-adapter` for horizontal scaling across multiple API servers
- Leaderboard updates debounced to max 1 broadcast/second

---

## 13. External Integrations

### Sport Data API

**API-Football** (via RapidAPI)
- Good Saudi League coverage
- More affordable entry tier

### Push Notifications
- **Expo Push Notifications** (mobile)
- Triggers: match starting soon, goal scored (squad player), prediction resolved, badge earned
- Store Expo push token in `users` table

### Email
- We will use Mailjet for email sending
- Transactional: Resend or Postmark
- Triggers: Welcome email, password reset

---

## 15. Environment Variables

### Backend `.env`
```
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qadsiah_fantasy

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# External API
SPORTMONKS_API_KEY=your_key_here
SPORT_API_PROVIDER=sportmonks  # or api_football

# Push Notifications
EXPO_ACCESS_TOKEN=your_expo_token

# Email
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@qadsiah-fantasy.com

# Cloudinary
CLOUDINARY_CLOUD_NAME="docbnlocz"
CLOUDINARY_UPLOAD_PRESET="qasiah"
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Qadsiah Fantasy
```

---

## 16. Folder Structure

### Backend
```
/backend
├── src/
│   ├── config/
│   │   ├── database.js       # Prisma/Drizzle client
│   │   ├── redis.js          # Redis client
│   │   └── socket.js         # Socket.IO setup
│   ├── middleware/
│   │   ├── auth.js           # JWT verify middleware
│   │   ├── requireAdmin.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── players.js
│   │   ├── squad.js
│   │   ├── matches.js
│   │   ├── predictions.js
│   │   ├── leaderboard.js
│   │   └── admin/
│   ├── services/
│   │   ├── pointsService.js  # Points calculation logic
│   │   ├── leaderboardService.js
│   │   ├── badgeService.js
│   │   ├── sportApiService.js # External API calls
│   │   └── notificationService.js
│   ├── jobs/
│   │   ├── syncMatchJob.js   # Bull job: poll sport API
│   │   └── weeklyResetJob.js # Bull job: reset weekly leaderboard
│   ├── socket/
│   │   └── handlers.js       # Socket.IO event handlers
│   └── app.js
├── prisma/
│   └── schema.prisma
└── package.json
```

### Mobile App
```
/mobile
├── app/                      # Expo Router
│   ├── (auth)/
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── (tabs)/
│   │   ├── index.jsx         # Home / Live matches
│   │   ├── squad.jsx         # Build squad
│   │   ├── predict.jsx       # Predictions
│   │   └── leaderboard.jsx
│   └── profile/
├── components/
├── stores/                   # Zustand stores
│   ├── authStore.js
│   ├── squadStore.js
│   └── matchStore.js
├── hooks/
├── lib/
│   ├── api.js                # Axios instance
│   └── socket.js             # Socket.IO client
└── i18n/
    ├── en.json
    └── ar.json
```

---

## Testing project
- Using Playwright for end-to-end testing
- Using Jest for unit testing
- Using Supertest for API testing

## Ports
- Backend: 4000
- Frontend: 3000
- Admin: 3001
- Mobile App: 3002

## Main colors
DA2B1F red
FFDE01 yellow