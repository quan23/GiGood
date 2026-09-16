# BACKEND — Features + API Endpoints (from old Expo demo)

> Source: old demo `EXE101/GiGood` (`types/index.ts`, `lib/seed.ts`, `lib/GiGoodContext.tsx` 25 actions, 8 hooks, 5 auth + 9 app screens). This doc is the backend contract for 3-project monorepo: `Api/` (.NET, deploy) + `web/` (web FE, deploy) + `app_mobile/` (Expo, EAS APK).
> Related: `TECH_STACK_PLAN.md` (stack), `BACKLOG.md` + `tasks/*` (build order), `OPINIONS.md` (P1-P10 fixes — applied here).

## 0. Monorepo layout (new)

```
GiGood/
  Api/              # .NET 8 Web API (Minimal APIs vertical slice) — DEPLOY (Render free + Neon)
  web/              # Web frontend (deploy: Vercel/Render static) — coming after backend
  app_mobile/       # Expo mobile app (EAS APK) — coming after backend
  deploy/           # compose.yml, render.yaml, .env.example
  docs/             # shareable (this file + plans)
```

Decision: backend first, deployable bare minimum (Phase 0) before any FE work.

---

## 1. Feature inventory (old demo → backend need)

| # | Demo screen / flow | Demo files | State / actions (old) | Backend need | Priority |
|---|--------------------|------------|------------------------|--------------|----------|
| F1 | Welcome → RoleSelect (`seeker` orange / `tasker` teal) | `app/(auth)/index.tsx`, `role-select.tsx`, `REGISTER_ROLE` | `pendingSignupRole` local only | No API. Static FE. Lookup `GET /api/meta/roles` optional | P2 |
| F2 | Signup seeker (name, phone, password, location, agreed) | `signup-basic.tsx`, `FINISH_SIGNUP_SEEKER`, `SET_TEMP_SIGNUP_INFO` | Validates required+agreed; avatar `placehold.co`; welcome notif | `POST /api/auth/register` (seeker). Store `Users` + `TaskerProfile null`. Rules: name≥2, phone `^0\d{9}$`, password≥6, location required | P0 |
| F3 | Signup tasker step 2 (skills multi, bio, availability dropdown, vehicle dropdown, CCCD placeholder `verified:false`) | `signup-tasker-profile.tsx`, `FINISH_SIGNUP_TASKER`, `CATEGORY_META`, `AVAILABILITY_LABEL`, `VEHICLE_LABEL` | `skills: Category[]`, bio, availability 5 vals, vehicle 4 vals | Same register endpoint with `taskerProfile`. Persist skills/bio/availability/vehicle/verified. `GET /api/meta/{categories,availability,vehicles}` for dropdowns | P0 |
| F4 | Login phone+password + quick-login (Khánh Vy seeker / Minh Quân tasker) | `login.tsx`, `QUICK_LOGIN` | No password check, hardcoded profiles | `POST /api/auth/login`, `POST /api/auth/refresh` (rotate-on-use), `POST /api/auth/revoke` anonymous (GLM P7), `GET /api/me`. JWT: `sub=User.Id`, `jti` separate, 15m/7d, `RoleClaimType=role` (GLM P1/P6) | P0 |
| F5 | Role switch (single user dual roles, tab reset post/board) | `(app)/_layout.tsx` switcher, `SWITCH_ROLE` | Instant local switch | `POST /api/me/switch-role {role}` (400 if taskerProfile null when →tasker); re-issue token or DB-role check (GLM P6) | P0 |
| F6 | Post job (4 templates repair/cleaning/delivery/helper 150k/200k/50k/120k + custom; title/category/desc/budget/location/urgent `(Cần liền)`) | `(tabs)/post.tsx`, `POST_JOB`, `useJobs.postJob` | Validates all required; `budget≥10000`; escrow banner; `nextJobId=300`, `mapX/Y %` random | `POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/{id}`, `PATCH/DELETE /api/jobs/{id}` (owner). Rules: title≥5, desc required, price≥10000, location required. `Lat/Lng double` replaces `mapX/Y` (03). Seed 2 jobs like `INITIAL_JOBS` 201/202 | P0 |
| F7 | Matching radar (pulse + `Đã tìm trong {s}s`, random 1 of 3 SAMPLE_TASKERS, 4s sim, system chat, wallet→escrow shift) | `(tabs)/jobs.tsx`, `START_MATCHING`/`COMPLETE_MATCHING`, `MatchingOverlay.tsx` | `matchingJobIdRef`, `SAMPLE_TASKERS` random, `seekerWallet-=budget`, `escrow+=budget` | Real matching: `POST /api/jobs/{id}/match` (or auto on create) + `GET /api/jobs/{id}/candidates?` by skills/availability/vehicle + distance. `NotificationHub OnJobMatched`. No random assign in prod ( weaknesses to fix) | P1 (stub: accept flow covers MVP) |
| F8 | Tasker board (fake map grid + pins `mapX/Y`, available `finding` list, `Nhận việc này` → accept + escrow hold + goto active) | `(tabs)/board.tsx`, `ACCEPT_JOB` | Single-winner unchecked, `seekerWallet-=`, `escrow+=`, `activeTaskerSubTab=active` | `POST /api/jobs/{id}/accept` (tasker): tx + concurrency token + unique `Escrows(JobId)` → 409 on double (GLM P8). `GET /api/jobs?status=Open&lat&lng&radius&category` bbox + Haversine sort (GLM P10) | P0 |
| F9 | Tasker active (`assigned` mine, `Trò chuyện` → chat, `Báo đã hoàn thành` → `isCompletedReported` + amber waiting banner) | `(tabs)/active.tsx`, `REPORT_COMPLETED` | `isCompletedReportedByTasker=true` | `POST /api/jobs/{id}/report` (tasker, assigned→reported). `GET /api/jobs?status=Assigned&mine` | P0 |
| F10 | Seeker jobs (radar + matched card orange + `4.9 · 120 việc` fixed + active list + `Xác nhận & Giải ngân` rating5 + `Mở trò chuyện`) | `(tabs)/jobs.tsx`, `RELEASE_ESCROW` | `status→completed`, `taskerRating`, `escrow-=`, `taskerWallet+=` | `POST /api/jobs/{id}/release-escrow {rating?,comment?}` (seeker, payer, Held only; rating optional → 07 creates Review, GLM P8). `POST /api/jobs/{id}/cancel` + `POST /api/jobs/{id}/refund` with transitions Held→Released/Refunded | P0 |
| F11 | Chat dual-mode (sidebar+inline `tabs/chat.tsx` vs route `chat/[id].tsx`, `ChatBubble` green/gray, `SEND_CHAT`, `SET_ACTIVE_CHAT`, 100ms scroll) | `chat.tsx`, `chat/[id].tsx`, `ChatBubble.tsx`, `useChat` | Local `chats[]`, `time HH:mm` now | `POST /api/conversations {jobId}` idempotent, `GET /api/conversations` (+lastMessage/unread), `POST /api/conversations/{id}/messages`, `GET .../messages?cursor&limit=20`. `ChatHub JoinJobGroup/SendMessage/Typing` + `OnMessageReceived` query-token (GLM P2). Persist-then-commit-then-broadcast | P0 |
| F12 | Escrow/wallet (header cards `formatVnd`, `seekerWallet 1.42M/taskerWallet 2.85M/escrow 150k`, `history`/`earnings` sums) | `_layout.tsx` wallet cards, `useWallet`, `history.tsx`, `earnings.tsx` | Single global pool arithmetic, no ledger | Ledger: `Wallets(UserId PK, Balance CHECK≥0, Version uint xmin concurrency — Neon-only, decided)`, `WalletTransactions` append-only, `Escrows(JobId unique, Payer/Payee/Amount/Held/Released/Refunded)`. `GET /wallet/balance`, `GET /wallet/transactions`, `GET /escrows`, `POST /wallet/topup` stub | P0 |
| F13 | Ratings (`StarRow` 5 amber, `Rating.tsx` modal, `RELEASE_ESCROW` rating5 + `RATE_TASKER`) | `StarRow.tsx`, `modals/Rating.tsx`, `RATE_TASKER` | Fixed 5★, double-rate possible, avg `4.9` hardcoded | `POST /api/ratings {jobId,rate 1-5,comment}` unique `(JobId,ReviewerId)` 409, only Done participants; `GET /api/ratings?jobId&userId`; `GET /api/users/{id}/rating` app-side AVG (GLM P10) | P1 (after escrow) |
| F14 | Notifications (tray dropdown local `useState` + modal `notifications.tsx`, `PUSH_NOTIF/CLEAR_NOTIFS`, unread `#f0fdf4`, `hasUnread`) | `_layout.tsx` tray, `notifications.tsx`, `useNotifications` | In-memory array, `MARK_NOTIF_READ`, `notifBadge` dual logic | `Notifications` table (GLM P4). `GET /api/notifications`, `POST /api/notifications/mark-read`, `DELETE`. `NotificationHub NewNotification` on JobMatched/EscrowReleased/NewMessage. FCM stub only (foreground first) | P1 (after 04+06) |
| F15 | Profile (avatar 64 orange border, `Đồng` tier, skills chips+bio+avail/vehicle, phone/location, `Đăng xuất` resets state) | `profile.tsx`, `SIGN_OUT` | `placehold.co`/`unsplash` avatars, `verified:false` always | `GET/PATCH /api/me`, `POST /api/me/avatar` (multipart via `/api/upload`), `POST /api/me/verify` stub. Avatar upload whitelist+size (GLM P10) | P1 |
| F16 | Upload/images (none in demo — avatars are URLs) | — | No upload | `POST /api/upload` multipart → `/uploads/{guid}.ext` + `UseStaticFiles`. Needed for avatars + job images | P0 |
| F17 | Lookups/meta (categories, availability, vehicles, templates, formatVnd `vi-VN`) | `categories.ts`, `format.ts`, `post.tsx TEMPLATES` | Hardcoded vi strings, no i18n lib | `GET /api/meta/categories`, `/availability`, `/vehicles`, `/job-templates` (4 templates). `vi` default strings preserved | P2 |
| F18 | Infra (no backend, session-only, timers `setInterval 1s`/`Animated.loop`/`Toast 2500ms`, `expo-secure-store` unused) | `Toast.tsx`, `MatchingOverlay`, `store/` empty | Reload loses all | Replace with persist + JWT in secure storage + hub reconnect. FE-only toasts/animations stay FE | — |
| F19 | Web admin (display-only) + landing stub | — (no demo equivalent) | New surface | `Users.IsAdmin bool` (seed 1 admin) + `Admin` auth policy. `GET /api/admin/stats`, `GET /api/admin/users`, `POST /api/admin/users/{id}/ban`, `GET /api/admin/jobs`, `POST /api/admin/jobs/{id}/hide`, `GET /api/admin/escrows`, `POST /api/admin/escrows/{id}/release`, `POST /api/admin/escrows/{id}/refund` (reuse 06 ledger tx). Landing = static stub, no API | P2 (task 12, after 01+02+06) |

Seed to preserve: `INITIAL_JOBS` 201 (repair 150k, assigned Minh Quân T., 3 chats) + 202 (delivery 45k, finding) + `SAMPLE_TASKERS` ×3 + wallets 1.42M/2.85M/150k + `CATEGORY_META`/labels + 4 post templates.

---

## 2. Full API endpoint list (grouped)

Auth: no `Auth:` = anonymous; `Auth` = Bearer required. All DTOs `FluentValidation`. Errors `400 validation` / `401` / `403 not participant` / `404` / `409 conflict (double-accept/double-rate)`.

### Auth (`/api/auth`)
| Method | Path | Auth | Req | Res | Notes |
|--------|------|------|-----|-----|-------|
| POST | `/api/auth/register` | No | `{name, phone, password, location, role, taskerProfile?:{skills[],bio,availability,vehicle}}` | `201 {user, accessToken, refreshToken, expiresIn}` | Creates `Users` + `Wallets` row; phone unique; taskerProfile required if role=tasker |
| POST | `/api/auth/login` | No | `{phone, password}` | `200 {accessToken, refreshToken, expiresIn}` | BCrypt verify; JWT `sub=User.Id` (GLM P1) |
| POST | `/api/auth/refresh` | No | `{refreshToken}` | `200 {accessToken, refreshToken}` | Rotate-on-use; reuse-detection deferred |
| POST | `/api/auth/revoke` | No (refresh token) | `{refreshToken}` | `204` | Anonymous via refresh (GLM P7) |
| GET | `/api/me` | Yes | — | `200 User+Wallet+TaskerProfile` | Also `PATCH /api/me`, `POST /api/me/switch-role`, `POST /api/me/avatar`, `POST /api/me/verify` (see Users) |

### Users / Profile (`/api/me`, `/api/users`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/me` | Yes | Full profile + wallet summary |
| PATCH | `/api/me` | Yes | `{name?,location?,bio?,skills?,availability?,vehicle?,avatarUrl?}` name≥2 |
| POST | `/api/me/switch-role` | Yes | `{role}` → 400 if →tasker without taskerProfile; re-issue token or DB-role check (GLM P6) |
| POST | `/api/me/avatar` | Yes | Multipart → `{avatarUrl}` (wraps upload) |
| POST | `/api/me/verify` | Yes | Stub `{verified:false}` (KYC deferred) |
| GET | `/api/users/{id}` | Yes | Public mini-profile (name, avatar, ratingAvg) |
| GET | `/api/users/{id}/rating` | Yes | `{avg,count}` app-side AVG |

### Jobs (`/api/jobs`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/jobs?status&category&q&lat&lng&radius&cursor&limit` | Yes | Bbox filter + in-memory Haversine sort (GLM P10); `status Open/Assigned/Done/Cancelled`; seeker `finding`=Open |
| POST | `/api/jobs` | Yes (seeker) | `{title≥5,description,category,price≥10000,locationText,lat?,lng?,images?[]}` → `201 Job` status Open |
| GET | `/api/jobs/{id}` | Yes | Detail + images + participants + ratings |
| PATCH | `/api/jobs/{id}` | Yes (owner, Open) | Partial update |
| DELETE | `/api/jobs/{id}` | Yes (owner, Open) | Or cancel→Cancelled |
| POST | `/api/jobs/{id}/accept` | Yes (tasker) | Ledger Hold tx + concurrency + unique Escrow(JobId) → 409; `JobApplications` row |
| POST | `/api/jobs/{id}/match` | Yes | Stub for F7 (or auto); lists candidates (deferred full auto-match) |
| GET | `/api/jobs/{id}/candidates` | Yes | `?` by skills/availability/distance (deferred) |
| POST | `/api/jobs/{id}/report` | Yes (tasker, Assigned) | Sets reported flag (F9) |
| POST | `/api/jobs/{id}/release-escrow` | Yes (seeker/payer, Held) | `{rating?,comment?}` → Released + payee credit + Done (decoupled from Review) |
| POST | `/api/jobs/{id}/cancel` | Yes (owner) | Open→Cancelled; Held→Refund path |
| POST | `/api/jobs/{id}/refund` | Yes | Held→Refunded + payer credit (abandon path) |

### Conversations / Messages (`/api/conversations`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/conversations` | Yes | `{jobId}` idempotent → 200/201 Conversation |
| GET | `/api/conversations` | Yes | Mine + lastMessage + unreadCount |
| POST | `/api/conversations/{id}/messages` | Yes (participant) | `{body≤2000}` → 201 Message |
| GET | `/api/conversations/{id}/messages?cursor&limit=20` | Yes | Desc `CreatedAt+Id` cursor |

### Wallet / Escrow (`/api/wallet`, `/api/escrows`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/wallet/balance` | Yes | `{balance, escrowHeld, heldJobs[]}` |
| GET | `/api/wallet/transactions?cursor&limit` | Yes | Append-only ledger |
| POST | `/api/wallet/topup` | Yes | Stub `{amount}` for testing |
| GET | `/api/escrows?status&jobId` | Yes | Escrow list |

### Ratings (`/api/ratings`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/ratings` | Yes | `{jobId,rate 1-5,comment?}` unique (JobId,ReviewerId) → 409; Done participants only |
| GET | `/api/ratings?jobId&userId&cursor` | Yes | List + avg |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/notifications?cursor&limit` | Yes | + `unreadCount` |
| POST | `/api/notifications/mark-read` | Yes | `{ids?[] / all:bool}` → 204 |
| DELETE | `/api/notifications` | Yes | Clear → 204 |

`Type` values: `JobMatched`, `EscrowReleased`, `NewMessage`, plus `Welcome` (register greeting).

### Upload (`/api/upload`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/upload` | Yes | Multipart `image/* ≤5MB` → `{url:/uploads/{guid}.ext}` (whitelist, GLM P10) |

### Admin (`/api/admin`, `Admin` policy = `IsAdmin` claim)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/admin/stats` | Admin | `{users, jobsByStatus, escrowHeld, volumeToday}` for dashboard cards |
| GET | `/api/admin/users?query&cursor&limit` | Admin | List + ban flags |
| POST | `/api/admin/users/{id}/ban` | Admin | `{banned:bool}` → 204 |
| GET | `/api/admin/jobs?status&cursor&limit` | Admin | All jobs + owner info |
| POST | `/api/admin/jobs/{id}/hide` | Admin | `{hidden:bool}` → 204 (hidden excluded from board) |
| GET | `/api/admin/escrows?status` | Admin | All escrows + parties |
| POST | `/api/admin/escrows/{id}/release` | Admin | Force Held→Released via 06 ledger tx |
| POST | `/api/admin/escrows/{id}/refund` | Admin | Force Held→Refunded via 06 ledger tx |

### Meta (`/api/meta`)| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/meta/categories` | No | 4 `CATEGORY_META` |
| GET | `/api/meta/availability` | No | 5 labels |
| GET | `/api/meta/vehicles` | No | 4 labels |
| GET | `/api/meta/job-templates` | No | 4 post templates |

### Infra
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | No | `{status:"ok", version, time}` — deploy probe |
| GET | `/swagger` | No | Swashbuckle UI on .NET 8 (GLM P9) |
| GET | `/openapi.json` | No | Contract for web/mobile codegen |

### Realtime (SignalR, auth via `access_token` query + `OnMessageReceived`, GLM P2)
- `ChatHub /hubs/chat`: `JoinJobGroup(jobId)` (participant check), `SendMessage(jobId,body)` (persist→commit→broadcast `ReceiveMessage`), `Typing(jobId,bool)`.
- `NotificationHub /hubs/notifications`: server pushes `NewNotification` on JobMatched/EscrowReleased/NewMessage to `Clients.User(userId)`.

---

## 3. Data model (min, from §1)

`Users(Id Guid PK v7, Phone unique, PasswordHash, Name, AvatarUrl, RatingAvg, CurrentRole, IsAdmin bool default false, Banned bool default false, Skills json, Bio, Availability, Vehicle, Verified, CreatedAt)` · `RefreshTokens(Id, UserId FK, TokenHash SHA256, ExpiresAt, RevokedAt?, ReplacedBy?)` · `Categories(Id, Key, Label, Icon)` seed 4 · `Jobs(Id Guid v7 PK, OwnerId FK, Title, Description, Category, Price, Status, Lat?, Lng?, LocationText, IsReported, CreatedAt, UpdatedAt, ConcurrencyToken)` · `JobImages(JobId FK, Url)` · `JobApplications(JobId, WorkerId, Offer?, Status, PK(JobId,WorkerId))` · `Conversations(Id, JobId unique FK, CreatedAt)` · `Messages(Id, ConversationId FK idx+CreatedAt desc, SenderId FK, Body, CreatedAt)` · `Wallets(UserId PK FK, Balance CHECK≥0, ConcurrencyToken)` · `WalletTransactions(Id, UserId FK idx+CreatedAt, Type, Amount, RefJobId, CreatedAt)` append-only · `Escrows(Id, JobId unique, PayerId, PayeeId, Amount, Status, HeldAt, ReleasedAt?)` · `Reviews(Id, JobId, ReviewerId unique(JobId,ReviewerId), Rate CHECK 1-5, Comment, CreatedAt)` · `Notifications(Id, UserId FK idx+Read+CreatedAt, Type, Title, Body, JobId?, Read, CreatedAt)`.

---

## 4. Bare-minimum backend to deploy FIRST (Phase 0 — this week)

Scope: prove deploy pipeline before features. No DB dependency, no auth yet.

- [ ] `GET /health` 200 `{status:"ok"}` (Render probe)
- [ ] `GET /swagger` + `/openapi.json` (Swashbuckle)
- [ ] `GET /api/meta/categories` static (proves Minimal APIs group works)
- [ ] `Dockerfile` (publish Release, `$PORT`, non-root) + `.dockerignore`
- [ ] `deploy/compose.yml` (api only for Phase 0) + `deploy/render.yaml` + `.env.example`
- [ ] CORS `AllowWebDev` + `AllowCredentials` stub for future `web/`
- [ ] CI gate: `dotnet build` + `dotnet publish` green

Explicitly OUT of Phase 0: EF Core migrations, JWT, SignalR, escrow, upload, FCM, Neon. Those land per `tasks/01-06` after URL is live.

Acceptance: `curl https://<api>/health` → ok; `/swagger` loads; `docker compose -f deploy/compose.yml up --build` runs locally; `git tag api-v0.0.1`.
