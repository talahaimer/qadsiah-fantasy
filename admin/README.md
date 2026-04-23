# Qadsiah Fantasy — Admin Dashboard

Next.js 14 (App Router, JavaScript) internal ops console. Runs on **:3001** and consumes the backend API at `:4000`.

## Features

- **Admin-only** login — clients with `role !== 'admin'` are rejected immediately.
- **Overview** — live matches, upcoming count, player/user totals.
- **Matches**
  - Create + edit (team, date, venue, competition, season, external ID)
  - Quick status transitions: scheduled → live → completed (triggers backend sync job + resolve)
  - Score + prediction-lock controls
  - Manual "Sync now" to enqueue a sport-API pull
  - Real-time event feed (joins `match:{id}` socket room)
  - Manual event entry (goal, assist, cards, clean sheet, MOTM, etc.)
  - One-click points resolution
- **Players** — full CRUD with AR/EN names, position, jersey, fantasy value, external ID, photo URL, soft-delete (deactivate).
- **Users** — search + filter by role/tier, pagination, points breakdown.

## Run

```bash
cp .env.local.example .env.local
npm install
npm run dev              # http://localhost:3001
```

Backend must be running at `NEXT_PUBLIC_API_URL`.

Default admin credentials are seeded from the backend `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Structure

```
app/
  layout.js                 # RootLayout + Providers + AdminShell
  providers.js              # SWR
  login/page.js             # admin login (rejects non-admin)
  page.js                   # overview
  matches/                  # list + create + detail with live events
  players/page.js           # CRUD
  users/page.js             # list with filters
components/                 # Sidebar, AdminShell
lib/                        # api (auto-refresh), socket, format
stores/                     # authStore (zustand + localStorage, separate from website)
```

## Notes

- Uses its own localStorage key (`qadsiah-admin-auth`) so admin and fan sessions don't collide when testing on the same machine.
- All mutations go through the backend `/admin/*` routes (already protected by `requireAdmin` middleware).
