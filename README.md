# GiGood

Monorepo for GiGood rebuild — **Expo (React Native) + Vite + .NET 8 + Neon**. Mobile app refactored from the old `origin/demo` Expo app, kept as Figma/behavior reference. `vi` only for hardcoded strings. Target: **EXE201 tech-track**, 2-week vibe sprint.

## What's here

- **API** (`Api/`): .NET 8 Minimal APIs + EF Core/Npgsql — JWT auth (access + refresh), jobs CRUD + upload + geo radius, escrow wallet ledger (`xmin` concurrency), ratings, notifications, SignalR hubs (`/hubs/chat`, `/hubs/notifications`), display-only admin API, Swagger + `/health`, demo seed.
- **Mobile** (`app_mobile/`): Expo SDK 54 + expo-router + NativeWind — auth, job board/detail/create, escrow flow, chat, notifications, wallet, ratings, profile/role switch. Offline demo via `EXPO_PUBLIC_USE_MOCK=1`.
- **Web** (`web/`): Vite + React — landing, login, display-only admin (users/jobs/escrows/stats).
- **Deploy** (`deploy/`): `Api/Dockerfile` + compose (+ prod overlay) + `render.yaml` + Neon Postgres + EAS preview APK.

## Repo Layout

```
.
├── docs/                 # Shareable docs only (committed)
│   ├── TECH_STACK_PLAN.md
│   └── tasks/            # One self-contained task file per agent session
├── Api/                  # .NET 8 Web API (Minimal APIs + SignalR + Npgsql + EF Core)
├── app_mobile/           # Expo SDK 54 app (expo-router + NativeWind)
├── web/                  # Vite + React web (landing + display-only admin)
├── deploy/               # compose.yml + compose.prod.yml + render.yaml + .env.example
├── private/              # Local personal docs — IGNORED (see .gitignore)
└── README.md
```

## Quick Start

Prereqs: .NET 8 SDK + `dotnet-ef`, Node 20+.

```bash
git clone https://github.com/quan23/GiGood.git
cd GiGood

# 0. Env — copy templates and fill real values
cp deploy/.env.example .env                  # repo root (docker compose env_file)
cp app_mobile/.env.example app_mobile/.env
cp web/.env.example web/.env

# 1. Backend — ConnectionStrings__Default + Jwt__Key from env vars (or the
#    git-ignored Api/appsettings.Development.json); Neon dev branch URL
cd Api
dotnet restore
dotnet ef database update
dotnet run                                   # http://localhost:5000 — /health, /swagger

# 2. Mobile (Expo) — Android emulator reaches the host via 10.0.2.2, iOS sim via localhost
cd app_mobile
npm install
npx expo start

# 3. Web — http://localhost:5173
cd web
npm install
npm run dev
```

No-Neon option: `docker compose -f deploy/compose.yml --profile offline up` runs a local Postgres (`deploy/.env.example` documents the matching connection string).

## Demo accounts

| Phone | Role | Where |
| --- | --- | --- |
| `0901234567` | seeker | mobile app + web |
| `0912345678` | tasker | mobile app |
| `0900000000` | admin | web `/admin` (display-only) |

Password for all three: `123456`. Seeded automatically on API startup.

## Deploy

### 1. Neon (Postgres, free)

Create a project at [neon.tech](https://neon.tech) and use two branches: **dev** for local work, **prod** for Render. Run the schema once per branch with its pooled connection string:

```bash
# dev (local) — after setting ConnectionStrings__Default to the dev branch
dotnet ef database update --project Api

# prod (once, before the first Render deploy)
dotnet ef database update --project Api --connection "Host=<prod-host>;Database=<db>;Username=<user>;Password=<pass>;Pooling=true"
```

The API seeds the demo users/jobs/wallets on startup, so the first prod boot also fills the demo board.

### 2. Render (API + web, free)

`deploy/render.yaml` defines both services:

- `gigood-api` — Docker (`Api/Dockerfile`, `dockerContext: Api`), free plan, health check `/health`. Env: `ConnectionStrings__Default` (Neon prod pooled), `Jwt__Key` (32+ chars), `Jwt__Issuer`/`Jwt__Audience` (fixed), `Cors__WebOrigin` (the static site URL, e.g. `https://gigood-web.onrender.com` — without it the browser blocks the admin app).
- `gigood-web` — static site built from `web/dist`, env `VITE_API_BASE_URL=https://gigood-api.onrender.com`.

Steps: push `master` → Render Dashboard → **New → Blueprint** → pick the repo (blueprint path `deploy/render.yaml`) → fill the `sync: false` values → deploy. Verify:

```bash
curl -s https://gigood-api.onrender.com/health                 # {"status":"ok",...}
curl -s -o /dev/null -w "%{http_code}\n" https://gigood-api.onrender.com/swagger
curl -s -H "Content-Type: application/json" \
  -d '{"phone":"0900000000","password":"123456"}' \
  https://gigood-api.onrender.com/api/auth/login               # accessToken
curl -s https://gigood-web.onrender.com | head                 # landing
```

Free tier sleeps when idle: allow 30-60s for the first (cold-start) request.

### 3. EAS preview APK (Android)

`app_mobile/eas.json` ships a `preview` profile: internal distribution, `android.buildType: apk`, env `EXPO_PUBLIC_API_BASE_URL=https://gigood-api.onrender.com` and `EXPO_PUBLIC_USE_MOCK=0`. Replace the URL with your real Render API URL before building.

```bash
cd app_mobile
npx eas-cli login
npx eas-cli init                            # once: links the EAS project
npx eas-cli build:version:set -p android    # once: appVersionSource is "remote" (enter 1)
npx eas-cli build -p android --profile preview
```

Install: open the build page link or scan its QR code on the device, download the APK, allow "install unknown apps", then install. Log in with the demo accounts and run board → accept → chat against the Render URL.

### API URL switching

| Target | Source | Value |
| --- | --- | --- |
| Android emulator | `app_mobile/.env` | `http://10.0.2.2:5000` |
| iOS simulator | `app_mobile/.env` | `http://localhost:5000` |
| EAS preview APK | `app_mobile/eas.json` (`build.preview.env`) | `https://gigood-api.onrender.com` |
| Web dev / prod | `web/.env` / Render env | `http://localhost:5000` / `https://gigood-api.onrender.com` |

The app reads all of it through `app_mobile/lib/core/config/env.ts` (`API_BASE_URL`, `USE_MOCK`); never hardcode a URL.

### Local prod-like API

```bash
ConnectionStrings__Default="Host=..." Jwt__Key="..." \
  docker compose -f deploy/compose.yml -f deploy/compose.prod.yml --profile offline up --build
# API on http://localhost:8080 with ASPNETCORE_ENVIRONMENT=Production
```

## Docs

- `docs/TECH_STACK_PLAN.md` — Stack, API contracts, escrow ledger, 14-day schedule. Share this with team.
- `docs/BACKLOG.md` — Task board; each `docs/tasks/XX-*.md` is self-contained.

## Personal Docs

Do NOT commit personal notes to `docs/`. Put them in `private/` or `_local/` — both are git-ignored. Keep `docs/` clean for team.

## Remote

GitHub private repo: `GiGood` (create at https://github.com/new → Private → no README init → add remote below).

```bash
git remote add origin https://github.com/quan23/GiGood.git
git branch -M master
git push -u origin master
```
