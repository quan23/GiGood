# GiGood

Monorepo for GiGood rebuild — **Expo (React Native) + Vite + .NET 8 + Neon**. Mobile app refactored from the old `origin/demo` Expo app, kept as Figma/behavior reference. `vi` only for hardcoded strings. Target: **EXE201 tech-track**, 2-week vibe sprint.

## Repo Layout

```
.
├── docs/                 # Shareable docs only (committed)
│   ├── TECH_STACK_PLAN.md
│   └── tasks/            # One self-contained task file per agent session
├── Api/                  # .NET 8 Web API (Minimal APIs + SignalR + Npgsql) — coming next
├── app_mobile/           # Expo (React Native) app, refactor of origin/demo — coming next
├── web/                  # Vite + React web (landing + display-only admin, EXE201) — coming next
├── deploy/               # docker-compose + .env.example + render.yaml — coming next
├── private/              # Local personal docs — IGNORED (see .gitignore)
└── README.md
```

## Quick Start (after scaffold)

```bash
git clone https://github.com/quan23/GiGood.git
cd GiGood

# Backend
cd Api && dotnet restore && dotnet ef database update && dotnet run

# Mobile (Expo) — dev emulator uses 10.0.2.2, iOS sim uses localhost
cd app_mobile && npm install && EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000 npx expo start

# Web (landing + admin)
cd web && npm install && npm run dev
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
