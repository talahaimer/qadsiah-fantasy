# Qadsiah Fantasy — Mobile App (Expo)

Expo SDK 52, Expo Router, React Native 0.76, NativeWind v4, Zustand, SWR, Socket.IO, i18next (EN/AR + RTL), Expo Notifications.

Dev port: **3002**. Consumes the backend API at `apiUrl` in `app.json` (default `http://localhost:4000`).

## Quick start

```bash
cd /Volumes/Dev/qadisiya/user-app
npm install              # or: npx expo install  (preferred for SDK-aligned versions)
npm run start            # Metro bundler on :3002
# then press i / a / w for iOS / Android / Web
```

> On physical devices, replace `localhost` in `app.json > extra.apiUrl` with your machine's LAN IP (e.g. `http://192.168.1.10:4000`).

## Structure

```
app/
  _layout.js                # Root: providers, i18n init, auth gate
  (auth)/
    _layout.js
    login.js
    register.js
  (tabs)/
    _layout.js              # bottom tabs
    index.js                # home / matches
    squad.js                # builder
    predict.js              # predictions
    leaderboard.js          # global + weekly
  match/[id].js             # live match detail (socket)
  profile/index.js          # profile + badges + lang + logout

components/                 # Screen, Card, Button, Input, MatchCard, PlayerCard
lib/
  api.js                    # fetch wrapper with auto-refresh
  socket.js                 # Socket.IO (JWT handshake)
  i18n.js                   # i18next + RTL direction handling
  push.js                   # Expo push registration → PATCH /users/me
  storage.js                # AsyncStorage adapter for Zustand
  config.js                 # reads apiUrl/socketUrl from expo-constants
stores/
  authStore.js              # tokens + user, persisted via AsyncStorage
  squadStore.js             # builder state (picks, captain, formation)
i18n/en.json · i18n/ar.json
```

## Features

- **Auth** — JWT access + refresh with auto-refresh on 401, persisted session.
- **Home** — hero + live/upcoming/recent match cards; triggers Expo push registration.
- **Squad** — formation chips, budget bar (cap 100), captain toggle, 5–11 picks; PATCH/POST `/squad`.
- **Predictions** — score steppers, scorer + MOTM pills, 5-minute server-side lock respected.
- **Leaderboard** — global / weekly tabs + my-rank card.
- **Match detail** — joins `match:{id}` socket room; auto-refreshes on `match_event` / `match_update`.
- **Profile** — tier, points, streak, badges, language toggle (EN ↔ AR, RTL flip), logout.

## Notes

- **RTL on iOS/Android**: `I18nManager.forceRTL` flips layout direction; production builds require a reload to fully apply (Expo Go handles this reasonably during dev).
- **Push notifications**: requires a physical device + EAS `projectId` in `app.json > extra.eas.projectId` for real pushes; dev works via Expo Go.
- **New Architecture**: enabled (`newArchEnabled: true`) — all deps pinned here are compatible.

## Ports (per spec)

- Backend: 4000 · Website: 3000 · Admin: 3001 · **Mobile dev: 3002**
