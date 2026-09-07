# GiGood

Monorepo for GiGood rebuild — **Flutter + .NET 8**. Old `EXE101` demo (`Expo SDK 54`) used as Figma only. `vi` default, `en` secondary. Targets: `PRM393` (30%) + `EXE201` tech-track, 2-week vibe sprint.

## Repo Layout

```
.
├── docs/                 # Shareable docs only (committed)
│   └── TECH_STACK_PLAN.md
├── Api/                  # .NET 8 Web API (Minimal APIs + SignalR) — coming next
├── app_mobile/         # Flutter app (PRM393) — coming next
├── web/                # Vite + React web (landing + display-only admin, EXE201) — coming next
├── deploy/               # docker-compose + .env.example — coming next
├── private/              # Local personal docs — IGNORED (see .gitignore)
└── README.md
```

## Quick Start (after scaffold)

```bash
git clone https://github.com/quan23/GiGood.git
cd GiGood

# Backend
cd Api && dotnet restore && dotnet ef database update && dotnet run

# Frontend (mobile)
cd app_mobile && flutter pub get && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000

# Frontend (web: landing + admin)
cd web && npm install && npm run dev
```

## Docs

- `docs/TECH_STACK_PLAN.md` — Stack, API contracts, escrow ledger, 14-day schedule. Share this with team.

## Personal Docs

Do NOT commit personal notes to `docs/`. Put them in `private/` or `_local/` — both are git-ignored. Keep `docs/` clean for team.

## Remote

GitHub private repo: `GiGood` (create at https://github.com/new → Private → no README init → add remote below).

```bash
git remote add origin https://github.com/quan23/GiGood.git
git branch -M master
git push -u origin master
```
