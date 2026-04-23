# Qadsiah Fantasy — Website

Fan-facing Next.js 14 (App Router, JavaScript) web app. Consumes the backend at `http://localhost:4000/api/v1` + Socket.IO.

## Features

- JWT auth (access + refresh) with auto-refresh + persisted session (Zustand + localStorage)
- Arabic ↔ English i18n with live RTL/LTR direction switching
- Home / matches list / live match detail (real-time via Socket.IO `join_match`)
- Squad builder: formation select, budget bar, captain toggle, 5–11 picks
- Predictions: score steppers, first scorer, MOTM; locked within 5 min of kickoff
- Leaderboard: global + weekly tabs, my rank
- Profile: tier, points, streak, badges
- Tailwind + Lucide icons, glass/dark aesthetic with Qadsiah gold accents

## Run

```bash
cp .env.local.example .env.local
npm install
npm run dev              # http://localhost:3000
```

Make sure the backend is running at the URL in `NEXT_PUBLIC_API_URL`.

## Structure

```
app/
  layout.js                # RootLayout + Providers
  providers.js             # SWR + i18n
  page.js                  # Home
  login/  register/        # auth
  matches/  matches/[id]/  # list + live detail
  squad/                   # builder
  predictions/             # submit + history
  leaderboard/             # global/weekly + my rank
  profile/                 # profile + badges
components/                # Header, MatchCard, PlayerCard, LanguageSwitcher, ProtectedRoute
lib/                       # api (fetch + auto-refresh), socket, i18n
stores/                    # authStore, squadStore (Zustand)
i18n/                      # en.json, ar.json
```

## Ports

- Website: **3000** · Admin: 3001 · Mobile dev: 3002 · Backend: 4000
