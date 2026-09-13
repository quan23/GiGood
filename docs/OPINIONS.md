# OPINIONS — 4-Model Batch Review (max variant, read-only)

> Ran 2026-09-03 via `opencode run --model opencode-go/* --agent *-opinion --variant max` from `GiGood/`.
> Agents are personal gitignored (`.opencode/agents/*-opinion.md`), this synthesis is shareable.
> Note: `--agent <subagent>` warns `subagent, not a primary agent. Falling back to default agent` — model override still applied (`> build · minimax-m3` etc.), prompt from agent file was NOT auto-loaded, so each run passed explicit read-only prompt. For full agent-prompt runs, use TUI `@mention`.

## Pivot note (2026-09-13)

Mobile pivoted to an **Expo (React Native) refactor** of `origin/demo`; PRM393 is out and the project is **EXE201-only**. The Flutter-specific recommendations below are **VOID** (kept as history):
- DeepSeek "KEEP Flutter bloc/dio" keep-bloc item.
- MiniMax "Bloc visibility" P0 gate items.
- Qwen `flutter_map` / `FakeJobsRepo` / `get_it` items -> RN equivalents: keep the existing hook surface, demo-visual map (no SDK), seed/mock switch via `EXPO_PUBLIC_USE_MOCK`.

Backend findings **P1-P10 still stand** (they are stack-agnostic .NET/Postgres fixes). Model for future runs: `opencode-go/deepseek-v4.1-flash`.

---

## Commands used

```bash
opencode run --agent deepseek-opinion --model opencode-go/deepseek-v4-flash-vision-exp --variant max "Read docs/TECH_STACK_PLAN.md and docs/BACKLOG.md. ..."
opencode run --agent minimax-opinion --model opencode-go/minimax-m3 --variant max "..."
opencode run --agent glm-opinion --model opencode-go/glm-5.3-flash --variant max "..."
opencode run --agent qwen-opinion --model opencode-go/qwen3.8-flash --variant max "..."
```

Models verified via `opencode models`: `opencode-go/deepseek-v4-flash-vision-exp`, `opencode-go/minimax-m3`, `opencode-go/glm-5.3-flash`, `opencode-go/qwen3.8-flash` all exist. Native `minimax/*`, `z-ai/*`, `alibaba/*` need separate keys — use `opencode-go/*`.

---

## DeepSeek V4 Flash Vision — keep/cut/defer + risks

1. **KEEP** Flutter bloc/dio + .NET 8 Minimal APIs vertical slice. Single project, explicit Bloc scores PRM393.
2. **KEEP** Escrow ledger per-job WalletTransactions + `xmin` concurrency + unique Escrows(JobId). This is EXE201 transaction evidence.
3. **KEEP** Seed with real lat/lng + i18n vi default. Seeded Q1 jobs make map/board alive, kills cold-start demo risk.
4. **CUT from 2w:** Refresh rotation + reuse-detection family revocation. Keep opaque 7d refresh + rotate-on-use, skip reuse-detection (can't demo, OWASP-only).
5. **DEFER:** FCM (foreground hub only), PostGIS, Neon/Render to last 0.5d, admin/OTP/S3.

Top 3 risks: (1) JWT 401 loop — curl-first contract test. (2) Escrow double-accept 409 without UX fallback looks broken. (3) 0.5d tasks slipping with no buffer — reserve D13-14 deploy+rehearsal only.

## MiniMax M3 — MVP cut + grading + EXE201

- MVP = tasks 00→11 (~8.5d + 5.5d buffer). P0 gates: DB/API skeleton (00), Swagger+hosted URL (10+11), APK (11), Bloc visibility (00/04/06), 10 screens (01/02/03/04/05/06), tests folder (10).
- EXE201 tech-track: O1 MVP from 02+03, channels from 05+11, escrow rows = bills (06), feedback form (10), BMC/staffing parallel docs.
- Defer hard: Clean Arch, MediatR, Azure SignalR Service, Blob/S3, OTP, admin, PostGIS. Soft: FCM bg, PostGIS, BE xUnit, CI, cursor pagination fancy, Cubit granularity, web build beyond demo.
- Open decisions (§13) still block WBS: DB prod, map key, upload, state granularity, track, prompt ownership.

## GLM 5.3 Flash — backend validation (highest signal)

Repo is docs-only (no `Api/` yet) — validates design, found real bugs:

- **P1 JWT bug:** `sub = jti = Guid` — sub must = User.Id, jti separate. Set RoleClaimType="role", NameClaimType="sub".
- **P2 SignalR 401:** JwtBearer reads header only; `signalr_netcore` sends `access_token` query. Need `OnMessageReceived` reading query for `/hubs/*`. Missing everywhere.
- **P3 RowVersion breaks Postgres switch (RESOLVED):** `rowversion` is SQL-Server-only — DECIDED Neon Postgres only, concurrency via `xmin` (`uint Version` + `IsConcurrencyToken()`).
- **P4 Entity gaps:** "8 tables" lists 10; missing Category seed table, Notifications table, taskerProfile storage.
- **P5 User PK contradiction:** `Id Guid` + `Phone string PK` — use Id PK + unique index Phone.
- **P6 Role staleness:** role claim baked 15m, CurrentRole switches — check DB CurrentRole on `accept`, or re-issue on switch.
- **P7 Revoke requires auth:** logout with expired AT loops 401 — make revoke anonymous via refresh token.
- **P8 Escrow edges:** unique Escrows(JobId) blocks re-accept after refund (refund transitions undefined); release couples 06→07 Review table; add CHECK Balance>=0; broadcast after CommitAsync.
- **P9 Package drift:** .NET 8 → Swashbuckle (not Scalar OpenApi, that's .NET 9); `Microsoft.AspNetCore.SignalR` NuGet unnecessary (in-box).
- **P10 minor:** upload whitelist+size (stored-XSS), Haversine won't translate in LINQ (bbox+in-memory sort), Guid PK fragmentation → Guid.CreateVersion7(), RatingAvg app-side not trigger, §5.1 omits cancel/GET escrows.

7-day backend order: D1 scaffold+all entities+migration+seed (fix P3/P4/P5 now) → D2 auth (P1/P7) → D3 jobs+upload+report/cancel → D4 wallet/escrow (P8) → D5 chat (P2) → D6 notifications → D7 ratings+xUnit+Swagger+deploy smoke.

## Qwen 3.8 Flash — frontend + task template critique

- **No FE/BE split per task** blocks parallel FE/BE dev. Fix: FakeJobsRepo behind get_it in 00 so FE runs ahead.
- **02 fattest** (CRUD+upload+seed+3 screens in 1d) — split 02a BE / 02b FE.
- **05 before 06 backwards** — NotificationHub events depend on escrow (06)/ratings (07). Move 05 after 07 or deps `01,04,06`.
- **Graph contradicts table** (10 roots differ). Fix ASCII graph.
- **Nav shell no owner** (tab shell smeared 00/01/08/09) — assign to 00 or 08.
- **i18n-last trap** — vi keys must be written inside 01-08, 09 = sweep only.
- **Tests deferred to 10** contradicts 01's verification — ship AuthBloc test in 01, JobCard test in 02.
- **06 mixes money BE + wallet UI** — split FE checkout screen out.
- **03 map key risk** — start flutter_map, swap later.

Template: section names drift from BACKLOG convention; add Out-of-scope/Owner/Est per file; add Setup env snippet ($AT/$ID); clarify branch→PR vs push-to-master; demo-spec refs unresolvable; per-task DoD test missing.

7-day FE order: F1 theme/dio-shell/router+fake repos/freezed/i18n wiring → F2 auth screens+Bloc+secure storage → F3 jobs+JobCard+test → F4 map (flutter_map default) → F5 chat hub+Bloc → F6 wallet/escrow UI+notifications tray → F7 profile+roleswitch+i18n sweep+tests+APK.

---

## Accepted fixes (applied to tasks)

1. 01-auth: `sub=User.Id`, `jti` separate, claim types; revoke anonymous via refresh token; AuthBloc test ships in 01.
2. 04-chat: `OnMessageReceived` query-token for `/hubs/*`; ChatHub validates participation.
3. 06-escrow: `CHECK (Balance>=0)`, broadcast after commit, refund transitions defined, release decoupled from 07 Review (rating optional).
4. 05-notifications: deps `01,04,06` (after escrow), foreground-hub-first, FCM stub.
5. 02-jobs: split note 02a BE / 02b FE, JobCard widget test in 02, upload whitelist+size.
6. 00-scaffold: FakeRepos + nav shell owner + flutter_map default + Swashbuckle on .NET 8.
7. 09-i18n: keys written inside 01-08, 09 = sweep.
8. DB decided: Neon Postgres only (dev+prod branches) — concurrency via `xmin`, no SQL Server anywhere.

## Deferred (unchanged)

FCM bg, PostGIS, Clean Arch, MediatR, Azure SignalR/Blob, OTP, BE xUnit beyond smoke, CI.
