# BACKLOG — GiGood Rebuild (Expo + Vite + .NET 8 + Neon)

> Index for AI-agent sessions. Each `tasks/XX-*.md` is self-contained: one session = one file, copy-paste prompt + verify.
> Source: `TECH_STACK_PLAN.md` (stack + 14-day schedule). EXE201 outcomes mapped.

## How to use

1. Pick next task in order (deps matter). One agent = one task file.
2. Prompt: `Implement docs/tasks/XX-*.md. Use stack from docs/TECH_STACK_PLAN.md. No extraDeps without ask.`
3. Verify: `npx tsc --noEmit`, `dotnet build`, `dotnet ef migrations` where relevant, manual `curl`/Expo check listed in Acceptance.
4. Commit: `feat(<scope>): <title> (#XX)` on `master`. Push when green.

## Board

| # | File | Scope | Depends | EXE201 | Est |
|---|------|-------|---------|--------|-----|
| 00 | `tasks/00-scaffold-monorepo.md` | Import `origin/demo` Expo app + nav shell + axios/query/SecureStore + mock switch + compose/render/Neon wiring | — | — | 0.5d |
| 01 | `tasks/01-auth-jwt.md` | Auth screens wired to API + token interceptor + SecureStore | 00 | — | 1d |
| 02 | `tasks/02-jobs-crud-upload.md` | Jobs CRUD wiring + image-picker upload + seed | 00,01 | O1 MVP | 1d |
| 03 | `tasks/03-map-geospatial.md` | Lat/Lng/radius geo query on demo visual (no map SDK) | 02 | O1 | 0.5d |
| 04 | `tasks/04-chat-signalr.md` | Conversations/Messages REST + SignalR ChatHub | 01,02 | — | 1d |
| 05 | `tasks/05-notifications-fcm.md` | Notifications REST + NotificationHub, local only | 01,04,06 | Channels | 0.5d |
| 06 | `tasks/06-wallet-escrow-ledger.md` | Wallets + Escrows + ledger tx + `xmin` concurrency | 01,02 | Revenue KPI | 1d |
| 07 | `tasks/07-ratings.md` | Two-way reviews + avg wiring | 02,06 | — | 0.5d |
| 08 | `tasks/08-profile-roleswitch.md` | Profile edit + avatar + role switch + verify | 01 | Staffing | 0.5d |
| 09 | `tasks/09-i18n-polish.md` | vi-only polish + design tokens + empty states + a11y | 01-08 | MKT polish | 0.5d |
| 10 | `tasks/10-tests-swagger-seed.md` | 1 Jest smoke test + Swagger + seed | 01-08 | Feedback form | 1d |
| 11 | `tasks/11-deploy-apk.md` | Render free + Neon prod + EAS preview APK + web static + API URL switch | 00-10,12 | Web demo | 0.5d |
| 12 | `tasks/12-web-vite-admin.md` | Vite landing stub + display-only admin (users/jobs/escrows/stats) | 01,02,06 | Web demo + admin | 1d |

## Dependency graph

```
00 (owns nav shell + seed/mock switch)
├─01 (auth screens + interceptor + SecureStore)
│  ├─02a BE CRUD/upload ──02b FE jobs wiring (split if slips)
│  │  ├─03 (demo visual + real lat/lng)
│  │  ├─04 (needs OnMessageReceived query-token)
│  │  └─06 (escrow; CHECK Balance>=0, post-commit broadcast)
│  │     ├─07 (ratings)
│  │     ├─05 (notifications; deps 01,04,06 — after escrow)
│  │     └─12 (web admin; deps 01,02,06 — read-only, parallel with 07-10)
│  └─08 (profile+roleswitch; re-issues token or DB role check)
│     └─09 (vi polish only — demo strings are hardcoded vi)
└─10 (Swagger Swashbuckle on .NET 8 + seed polish; table says after 01-08)
   └─11 (deploy last 0.5d: API + web static + EAS preview APK)
```

## Conventions for each task file

- **Goal** — what ships in this session.
- **Depends** / **Branch** — `feat/XX-*` off `master`.
- **API contract** — endpoints + DTOs + validation.
- **Mobile (Expo)** — hooks/blocs + screens/components + deps.
- **Files to touch** — exact paths.
- **Steps** — numbered, vibe-prompt friendly.
- **Acceptance** — manual curl/Expo checks.
- **Verification** — `dotnet build && npx tsc --noEmit` must pass.
- **Commit** — message template + push.

## Opinions (personal, gitignored)

Run personal reviewers: `@deepseek-opinion`, `@minimax-opinion`, `@glm-opinion`, `@qwen-opinion` on `TECH_STACK_PLAN.md` or any task file. They are in `.opencode/agents/*-opinion.md` (local only).

## Change process

- Add task: create `tasks/13-*.md` + add row here.
- Defer: move row to `## Deferred` below with reason, don't delete history.

## Deferred

- OTP SMS / PostGIS radius search / Azure Blob / FCM real push — post-2w.

## Verification (whole backlog)

```bash
# from GiGood/
dotnet build Api/            # or dotnet build
npx tsc --noEmit             # app_mobile
npm test                     # app_mobile (Jest smoke)
npm --prefix web run build
dotnet ef migrations list
curl -s http://localhost:5000/swagger | head
```
