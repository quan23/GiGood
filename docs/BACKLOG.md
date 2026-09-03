# BACKLOG — GiGood Rebuild (Flutter + .NET 8)

> Index for AI-agent sessions. Each `tasks/XX-*.md` is self-contained: one session = one file, copy-paste prompt + verify.
> Source: `TECH_STACK_PLAN.md` (stack + 14-day schedule). PRM393 gates + EXE201 Outcomes mapped.

## How to use

1. Pick next task in order (deps matter). One agent = one task file.
2. Prompt: `Implement docs/tasks/XX-*.md. Use stack from docs/TECH_STACK_PLAN.md. No extraDeps without ask.`
3. Verify: `flutter analyze`, `dotnet build`, `dotnet ef migrations` where relevant, manual `adb`/`curl` check listed in Acceptance.
4. Commit: `feat(<scope>): <title> (#XX)` on `master`. Push when green.

## Board

| # | File | Scope | Depends | PRM393 | EXE201 | Est |
|---|------|-------|---------|--------|--------|-----|
| 00 | `tasks/00-scaffold-monorepo.md` | Repo scaffold + compose + env | — | DB/API skeleton | — | 0.5d |
| 01 | `tasks/01-auth-jwt.md` | Auth register/login/refresh + JWT + secure storage | 00 | Login screen | — | 1d |
| 02 | `tasks/02-jobs-crud-upload.md` | Jobs CRUD + categories + image upload + seed | 00,01 | Product list/detail | O1 MVP | 1d |
| 03 | `tasks/03-map-geospatial.md` | Lat/Lng + geospatial query + map UI | 02 | Map screen | O1 | 0.5d |
| 04 | `tasks/04-chat-signalr.md` | Conversations/Messages REST + SignalR ChatHub | 01,02 | Chat + State mgmt | — | 1d |
| 05 | `tasks/05-notifications-fcm.md` | NotificationHub + FCM stub + tray | 01,04 | Notifications | Channels | 0.5d |
| 06 | `tasks/06-wallet-escrow-ledger.md` | Wallets + Escrows + ledger tx + RowVersion | 01,02 | Billing/Cart (escrow) | Revenue KPI | 1d |
| 07 | `tasks/07-ratings.md` | Two-way reviews + avg | 02,06 | Rating | — | 0.5d |
| 08 | `tasks/08-profile-roleswitch.md` | Profile edit + avatar + role switch + verify | 01 | Role mgmt | Staffing | 0.5d |
| 09 | `tasks/09-i18n-polish.md` | vi default + design tokens + empty states + a11y | 01-08 | i18n | MKT polish | 0.5d |
| 10 | `tasks/10-tests-swagger-seed.md` | Unit/widget + bLoC tests + Swagger Scalar + seed | 01-08 | Tests gate | Feedback form | 1d |
| 11 | `tasks/11-deploy-apk.md` | Render/Neon deploy + `flutter build apk --release` + `--dart-define` switch | 00-10 | Hosted URL + APK | Web demo | 0.5d |

## Dependency graph

```
00
├─01
│  ├─02 ──03
│  │  ├─04 ──05
│  │  └─06 ──07
│  └─08
│     └─09
└─10 (after 01-08)
   └─11
```

## Conventions for each task file

- **Goal** — what ships in this session.
- **Depends** / **Branch** — `feat/XX-*` off `master`.
- **API contract** — endpoints + DTOs + validation.
- **Flutter** — Bloc states/events + screens/widgets + deps.
- **Files to touch** — exact paths.
- **Steps** — numbered, vibe-prompt friendly.
- **Acceptance** — manual curl/widget checks.
- **Verification** — `dotnet build && flutter analyze` must pass.
- **Commit** — message template + push.

## Opinions (personal, gitignored)

Run personal reviewers: `@deepseek-opinion`, `@minimax-opinion`, `@glm-opinion`, `@qwen-opinion` on `TECH_STACK_PLAN.md` or any task file. They are in `.opencode/agents/*-opinion.md` (local only).

## Change process

- Add task: create `tasks/12-*.md` + add row here.
- Defer: move row to `## Deferred` below with reason, don't delete history.

## Deferred

- Admin panel / OTP SMS / PostGIS radius search / Azure Blob — post-2w.

## Verification (whole backlog)

```bash
# from GiGood/
dotnet build Api/       # or dotnet build
flutter analyze
flutter test
dotnet ef migrations list
curl -s http://localhost:5000/swagger | head
adb install build/app/outputs/flutter-apk/app-release.apk
```
