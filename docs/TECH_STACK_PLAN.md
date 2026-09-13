# GiGood Rebuild — Tech Stack Plan

> **Source:** `origin/demo` — old `EXE101` `GiGood` (Expo SDK 54 + RN + NativeWind) used as the base for an **Expo refactor**, not a rebuild. Stack: **Expo (React Native) + Vite + React (web) + .NET 8 (BE) + Neon Postgres**.
> **Constraints:** Old team, new project. Deadline 11 weeks, target delivery 2 weeks (vibe code). `vi`-only hardcoded strings for MVP (`en` deferred). `.NET` backend + Expo mobile mandatory. `EXE201` tech-track only.
> **Status:** Draft for team confirmation. WBS will follow after approval.

---

## 1. Goals & Non-Goals

**Goals (2-week MVP must ship):**
- Real auth, persisted jobs, chat, map, wallet/escrow ledger, ratings, notifications, role switch, profile — replacing `lib/GiGoodContext.tsx` in-memory state with server state.
- EXE201 tech-track outcomes only: Outcome 1 MVP (marketable product + 3 product levels + financial plan), channel metrics (FB/TikTok/Web), transaction evidence via the escrow ledger.

**Non-Goals (post-2w):**
- Full i18n library (MVP ships `vi`-only hardcoded strings), remote/background push (local notifications only), real map SDK/key (demo visual + real `lat/lng`), Clean Architecture/MediatR/CQRS, Blob/S3 storage, SMS OTP — all deferred.

**Principle:** Refactor the Expo demo into a single vertical slice; keep the existing hook surface, replace reducer internals with React Query + context. .NET Minimal APIs direct (`AppDbContext`), no extra abstraction.

---

## 2. High-Level Architecture

```
                 ┌─────────────────┐
                 │  Expo App       │
                 │  expo-router 5  │──────┐ HTTPS + JWT (15m) + Refresh (7d)
                 │  axios + RN     │      │
                 └────────┬────────┘      │
                          │ SignalR WS     ▼
                 ┌────────▼────────┐  ┌──────────────────┐  ┌──────────────┐
                 │  Local notifs   │  │  .NET 8 Web API  │◄─┤ Vite + React │
                 │  (in-app tray)  │◄─┤  Minimal APIs    │  │ landing+admin│
                 └─────────────────┘  │  SignalR Hubs    │  │ (display-only│
                                      └──┬──────────┬────┘  └──────────────┘
                                         │ EF Core 8│  Npgsql only
                           ┌─────────────▼──┐  ┌──▼──────────────┐
                           │ Neon Postgres  │  │ wwwroot/uploads │
                           │ dev+prod branch│  │ (MVP static)    │
                           └────────────────┘  └─────────────────┘
```

- **Realtime:** SignalR `ChatHub` + `NotificationHub` for foreground in-app notifications.
- **Why not Firebase/Supabase as primary:** Neon Postgres + .NET API keeps visible DB/API ownership for the EXE201 build.

---

## 3. Frontend — Expo (React Native)

### 3.1 Version & Tooling

- **Expo SDK 54**, `expo-router 5` (file-based routes), TypeScript, **NativeWind 4**, `constants/theme.ts` design tokens (orange `#ea580c` / teal `#0f766e`, rounded-2xl, stone border), `@tanstack/react-query` (server state), `axios` (HTTP + refresh interceptor), `@microsoft/signalr` (chat), `expo-secure-store` (tokens), `expo-image-picker` (upload), `@expo/vector-icons` (FontAwesome).
- Env: `EXPO_PUBLIC_API_BASE_URL` (dev `http://10.0.2.2:5000` emulator) and `EXPO_PUBLIC_USE_MOCK=1`.

### 3.2 Refactor Rule

- Keep the existing hook surface: `useAuth`, `useJobs`, `useChat`, `useWallet`, `useSeeker`, `useTasker`, `useNotifications`, `useUi`.
- Replace `GiGoodContext` reducer internals with React Query for server state + a thin context for session (`useAuth`) and UI state (`useUi`). Screen components stay; only the data plumbing changes.
- Mock switch: `EXPO_PUBLIC_USE_MOCK=1` serves seeded data through the same hooks so FE can run ahead of BE.

### 3.3 Project Structure

```
app_mobile/
  app/
    (auth)/{index.tsx, role-select.tsx, signup-basic.tsx, signup-tasker-profile.tsx, login.tsx}
    (app)/_layout.tsx
    (app)/{post.tsx, board.tsx, jobs.tsx, active.tsx, chat.tsx, profile.tsx, notifications.tsx}
    (app)/job/[id].tsx
    (app)/chat/[id].tsx
  src/
    api/client.ts               # axios instance + 401=>refresh=>retry interceptor
    api/{auth.ts, jobs.ts, chat.ts, wallet.ts, ratings.ts, upload.ts}
    hooks/{useAuth,useJobs,useChat,useWallet,useSeeker,useTasker,useNotifications,useUi}.ts
    stores/                     # context session + UI (replaces GiGoodContext reducer)
    mock/                       # seeded jobs/taskers behind EXPO_PUBLIC_USE_MOCK
  constants/theme.ts            # orange #ea580c / teal #0f766e tokens
  assets/
```

### 3.4 Keep vs Discard from Demo

- **Keep as spec:** `tailwind.config.js` colors (orange `#ea580c` / teal `#0f766e`, `rounded-2xl`, stone border) → `constants/theme.ts`; font stacks (`Inter/Poppins`); icon set (`@expo/vector-icons` FontAwesome); flows `Welcome→RoleSelect→SignupBasic→TaskerProfile→(post/jobs/chat/history|board/active/chat/earnings)`; `types/index.ts` shapes `Role/Category/Availability/Vehicle/JobStatus`; `CATEGORY_META`/`AVAILABILITY_LABEL`/`VEHICLE_LABEL`; `formatVnd`; `ToastVariant`.
- **Discard:** `lib/GiGoodContext.tsx` reducer + `nextJobId=300` + `lib/seed.ts` in-memory seeds (move to `src/mock` + BE seed); timers `setInterval 1s` radar / `Animated.loop` pulse / `Toast 2500ms`; `QUICK_LOGIN` hardcode; `mapX/Y %` → `double lat/lng`; single global `escrowHeldPool`.

### 3.5 State Slices

- **Session (`useAuth`)** — context: `{ user, accessToken, login, register, logout }`; tokens in `expo-secure-store`.
- **Server (React Query)** — `useJobs` (list/post/accept/report/release), `useChat` (conversations/messages), `useWallet` (balance/transactions), `useNotifications`.
- **UI (`useUi`)** — role switch, active tab, toast, loading overlays.

### 3.6 Navigation

`expo-router` file routes:
`/ (splash) → /welcome → /role-select → /signup-basic → /signup-tasker-profile → /(app)/post (seeker) | /(app)/board (tasker) → /job/[id], /chat/[id], /profile, /notifications`. Guard: session token null → redirect to `/welcome` (root layout effect).

---

## 4. Backend — .NET 8 LTS

### 4.1 Template & Style

- `dotnet new webapi` **single project**. Minimal APIs + `MapGroup`. No Controllers/MediatR/Clean Arch overhead. Structure by **feature** (vertical slice):
```
Api/
  Program.cs
  Data/AppDbContext.cs
  Features/
    Auth/AuthEndpoints.cs + AuthDtos.cs + JwtProvider.cs
    Jobs/JobsEndpoints.cs + JobsDtos.cs
    Chat/ChatEndpoints.cs + ChatHub.cs
    Wallet/WalletEndpoints.cs
    Ratings/RatingsEndpoints.cs
    Upload/UploadEndpoints.cs
  Core/Entities/{User, Job, Conversation, Message, Wallet, Escrow, RefreshToken, Review}
  Hubs/{ChatHub.cs, NotificationHub.cs}
  Common/Auth/JwtProvider.cs + PasswordHasher.cs
```

### 4.2 Packages

```
Npgsql.EntityFrameworkCore.PostgreSQL
Microsoft.AspNetCore.Authentication.JwtBearer
Microsoft.AspNetCore.SignalR
Microsoft.AspNetCore.OpenApi  # + Scalar UI for Swagger
FluentValidation
BCrypt.Net-Next  # if custom hashing (else Identity PasswordHasher)
Swashbuckle.AspNetCore (alt)
```

### 4.3 Minimal APIs Example

```csharp
var jobs = app.MapGroup("/api/jobs").RequireAuthorization();
jobs.MapGet("/", async (AppDbContext db, ClaimsPrincipal user) => 
    TypedResults.Ok(await db.Jobs.Where(j=>j.OwnerId==uid).ToListAsync()));
jobs.MapPost("/", async (CreateJobDto dto, AppDbContext db, ClaimsPrincipal user) => {
    var job = new Job{ OwnerId=uid, Title=dto.Title, Category=dto.Category, Price=dto.Price, Lat=dto.Lat, Lng=dto.Lng, Status=JobStatus.Open };
    db.Jobs.Add(job); await db.SaveChangesAsync();
    await hub.Clients.Group("seekers").SendAsync("JobCreated", job);
    return TypedResults.Created($"/api/jobs/{job.Id}", job);
}).AddEndpointFilter<ValidationFilter<CreateJobDto>>();
```

### 4.4 Database

- **Neon Postgres only** (`UseNpgsql`, decided): dev uses Neon `dev` branch, prod uses `prod` branch. Optional `postgres:16` in `deploy/compose.yml` for offline dev only.
- **Migrations:** `dotnet ef migrations add Init` + `dotnet ef database update`. Concurrency via Postgres `xmin` (`uint Version` + `IsConcurrencyToken()`).
- **Indexes:** `Jobs(OwnerId, Status, Category, CreatedAt)`, `Messages(ConversationId, CreatedAt)`, `Escrows(JobId)`.

### 4.5 Entity Summary (8 tables max)

```csharp
User { Id Guid, Phone string PK, PasswordHash, Name, AvatarUrl, RatingAvg double, CurrentRole string, CreatedAt }
Job { Id Guid, OwnerId FK, Title, Description, Category string, Price decimal, Status enum[Open/Assigned/Done/Cancelled], Lat double, Lng double, CreatedAt, Version uint xmin }
JobApplication { JobId FK, WorkerId FK, PriceOffer, Status, PK(JobId,WorkerId) }
Conversation { Id Guid, JobId FK, CreatedAt }
Message { Id Guid, ConversationId FK, SenderId FK, Body, CreatedAt }
Wallet { UserId PK FK, Balance decimal, Version uint xmin }
WalletTransaction { Id Guid, UserId FK, Type enum[TopUp/Hold/Release/Refund], Amount decimal, RefJobId FK, CreatedAt } // append-only
Escrow { Id Guid, JobId FK, PayerId FK, PayeeId FK, Amount decimal, Status enum[Held/Released/Refunded], HeldAt, ReleasedAt }
RefreshToken { Id Guid, UserId FK, TokenHash string, ExpiresAt, RevokedAt nullable, ReplacedByToken nullable }
Review { Id Guid, JobId FK, ReviewerId FK, Rate int 1-5, Comment, CreatedAt }
```

### 4.6 File Upload (MVP)

```csharp
app.MapPost("/api/upload", async (IFormFile file) => {
    var name = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
    var path = Path.Combine("wwwroot","uploads", name);
    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
    await using var fs = File.Create(path);
    await file.CopyToAsync(fs);
    return TypedResults.Ok(new { url = $"/uploads/{name}" });
}).DisableAntiforgery().RequireAuthorization();
app.UseStaticFiles();
```

### 4.7 Seeding

On first run, seed `Categories` + 2 sample jobs mirroring `lib/seed.ts:INITIAL_JOBS` but with real `lat/lng` (e.g., Q1 10.7769,106.7009).

---

## 5. API & Real-Time Contracts

### 5.1 REST

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | `{name,phone,password,location,role,taskerProfile?}` → `{accessToken, refreshToken}` |
| POST | `/api/auth/login` | No | `{phone,password}` → tokens |
| POST | `/api/auth/refresh` | No | `{refreshToken}` → rotated pair |
| POST | `/api/auth/revoke` | Yes | logout |
| GET | `/api/me` | Yes | profile + wallet |
| GET/POST | `/api/jobs` | Yes | list/create; query `?status,category,lat,lng,radius` |
| GET | `/api/jobs/{id}` | Yes | detail |
| POST | `/api/jobs/{id}/accept` | Yes (tasker) | lock with `xmin` concurrency token, `Escrow Hold` tx |
| POST | `/api/jobs/{id}/report` | Yes (tasker) | `isCompletedReported` |
| POST | `/api/jobs/{id}/release-escrow` | Yes (seeker) | `{rating,comment}` → `Escrow Released`, ledger tx |
| GET/POST | `/api/conversations` | Yes | list/create per job |
| GET/POST | `/api/conversations/{id}/messages` | Yes | paginated `?cursor` |
| GET | `/api/wallet/balance` | Yes | current |
| GET | `/api/wallet/transactions` | Yes | history |
| POST | `/api/ratings` | Yes | two-way |
| GET | `/api/notifications` | Yes | list |
| POST | `/api/upload` | Yes | image |

All DTOs validated via `FluentValidation` + `ValidationFilter`. Responses `TypedResults.Ok/Error`.

### 5.2 SignalR

- **Hubs:** `ChatHub` (`JoinJobGroup(jobId)`, `SendMessage(jobId,text)`, `Typing(jobId,bool)`), `NotificationHub` (`OnJobMatched`, `OnEscrowReleased`, `OnNewMessage`).
- **JS client:** `new HubConnectionBuilder().withUrl(`${baseUrl}/hubs/chat`, { accessTokenFactory: () => token }).build()` (`@microsoft/signalr`). Auto-reconnect, groups `Clients.Group(jobId)`.

---

## 6. Auth & Security

- **Passwords:** `BCrypt` or `IPasswordHasher<User>` (cost 12). Store hash only.
- **JWT:** HS256, `sub=jti=Guid, phone, role`, 15m expiry, `Issuer=yourdomain, Audience=gigood`, `SymmetricSecurityKey` 32+ bytes. `TokenValidationParameters.ValidateIssuer/Audience/Lifetime/IssuerSigningKey, ClockSkew=30s`.
- **Refresh:** 64-char opaque `RandomNumberGenerator`, store `SHA256 hash`, 7d expiry, rotation: revoke old → issue new, reuse detection: if presented token already revoked/replaced → revoke entire family (steal).
- **Mobile storage:** `accessToken` in memory + `expo-secure-store`; `refreshToken` only in secure store (Keystore/Keychain, never `AsyncStorage`).
- **Axios interceptor:** response interceptor on 401 (not `/auth/refresh`) → `POST /auth/refresh` → update secure store → retry the original request; on failure → clear tokens + `router.replace('/login')`.

---

## 7. Internationalization

- MVP ships `vi`-only hardcoded demo strings (preserve existing copy). No `en` pass and no i18n library for the 2-week build.
- Full i18n (`i18next` / `expo-localization`) is deferred post-2w; keys can be introduced then without restructuring screens.

---

## 8. Feature Deep-Dives

### 8.1 Map

- **Client:** demo visual map (the existing board grid/pin layout) with jobs positioned by **real `lat/lng`** — no map SDK, no API key.
- **Data:** `Jobs.lat/lng double` (replaces `mapX/Y %`). Backend geospatial: `WHERE (Lat BETWEEN :lat±d) AND (Lng BETWEEN :lng±d)` plus `Haversine` ordering; add `PostGIS` later if needed.

### 8.2 Chat

- `Conversations` 1:1 per `Job` (or per seeker/tasker/job triple). `Messages` indexed pagination. Hub `JoinJobGroup` ensures only participants receive. Persist then broadcast: `db.Messages.Add(msg); await db.SaveChangesAsync(); await Clients.Group(jobId).SendAsync("ReceiveMessage", msg);`.

### 8.3 Escrow Ledger (Critical)

Never `wallet.Balance -= price` directly.

```
TopUp: WalletTransaction(+Amount) + Wallet.Balance += Amount
Create/Accept Job (Hold): Wallet.Balance -= Amount + WalletTransaction(-Hold, RefJobId) + Escrow(Held)   — in DB transaction + xmin concurrency check
Release (seeker confirms): Escrow.Status=Released + payee Wallet.Balance += Amount + WalletTransaction(+Release, payee)
Refund/Cancel: Escrow.Refunded + payer +Amount
```
```csharp
await using var tx = await db.Database.BeginTransactionAsync();
try {
  var wallet = await db.Wallets.FirstAsync(w=>w.UserId==payerId);
  if (wallet.Balance < amount) return TypedResults.BadRequest("Insufficient");
  wallet.Balance -= amount; // xmin concurrency token
  db.WalletTransactions.Add(new WalletTransaction{ UserId=payerId, Type=Hold, Amount=-amount, RefJobId=jobId });
  db.Escrows.Add(new Escrow{ JobId=jobId, PayerId=payerId, PayeeId=payeeId, Amount=amount, Status=Held });
  await db.SaveChangesAsync();
  await tx.CommitAsync();
} catch (DbUpdateConcurrencyException) { await tx.RollbackAsync(); return TypedResults.Conflict("Retry"); }
```

### 8.4 Ratings

Two-way 1-5 + comment, one per `Job` per direction, `CHECK (Rate BETWEEN 1 AND 5)`, update `User.RatingAvg` via trigger or `AVG` query. Prevent double-submit via unique index `(JobId, ReviewerId)`.

---

## 9. DevOps, Config & Release

- **Config:** `EXPO_PUBLIC_API_BASE_URL` env (dev `http://10.0.2.2:5000` for emulator, `http://localhost:5000` for iOS sim). Never hardcode.
- **Hosting BE:** `Render free` for testing (sleeps when idle — cold start 30-60s; upgrade to Starter $7 before demo day if it hurts). Start `dotnet Api.dll` with `$PORT`. DB: `Neon` free Postgres (`dev` + `prod` branches, pooled connection string).
- **Hosting web:** `web/dist` as Render static site ($0) pointing at the API URL.
- **CORS:** `AllowExpoOrigin + AllowWebOrigin` + `AllowCredentials` for SignalR.
- **Mobile Release:** EAS Build `preview` profile → APK (requires an expo.dev account); `npx eas build -p android --profile preview`. Inject the API URL through `EXPO_PUBLIC_API_BASE_URL` at build time. Web demo = Vite `web/` (task 12).
- **CI (optional):** GitHub Actions: `dotnet build/test` + `tsc --noEmit` on PR.

---

## 10. Testing

- **Mobile:** Jest + React Native Testing Library. Exactly **1 smoke test** (task 10): render `JobCard` with a fake job and assert the title renders.
- **BE (optional):** `xUnit` for `JwtProvider` + `Escrow` concurrency if time allows.
- Lecturer/test gates dropped (EXE201 has no such grading requirement).

---

## 11. 2-Week Vibe Schedule (14 Days)

| Day | Deliverable | EXE201 Artifact |
|-----|-------------|-----------------|
| D1 | Task 00 — import `origin/demo` → `app_mobile/`; scaffold `Api/` + `AppDbContext` + migrations | — |
| D2 | Task 01 — Auth register/login/refresh/revoke + JWT + secure-store axios interceptor | — |
| D3 | Task 02 — Jobs CRUD + Categories + Upload + `POST /api/jobs` | BMC + Category meta |
| D4 | Task 03 — Map `lat/lng` + Board geospatial query | **Outcome 1 draft:** MVP + 3 product levels + Financial plan |
| D5 | Task 04 — Chat REST + SignalR `ChatHub` + RN hub service | — |
| D6 | Task 05 — Notifications Hub + local notifications tray | Channel setup FB/Insta/TikTok |
| D7 | Task 06 — Wallet/Escrow ledger tx + `xmin` concurrency + balance/transactions endpoints | Revenue KPI |
| D8 | Task 07 — Ratings (two-way) + `Review` + avg update | — |
| D9 | Task 08 — Profile + RoleSwitch (single user dual roles) + edit + avatar upload | Staffing plan |
| D10 | Task 09 — `vi` copy polish + theme tokens (`orange/teal`) + empty states | MKT content plan |
| D11 | Task 10 — Jest/RTL smoke test + Swagger Scalar + seed | Feedback form prep |
| D12 | Task 11 — Validation/error handling + pagination; deploy API to Render free + Neon prod (task 12 web admin parallel) | Feedback >=20 mock |
| D13 | Task 11 — EAS Build `preview` APK + wire prod URL + `web/dist` static | Hosted URL + APK + Deploy web demo |
| D14 | Demo script 15min + backup APK + recording + report outline | Outcome 1 final PDF |

Buffer: if blocked, defer remote push (foreground hub only) and PostGIS.

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RN↔.NET JWT mismatch | 401 loop | axios response interceptor + `accessTokenFactory`, test `curl` first, log `TokenValidationParameters` |
| Escrow race (2 taskers accept same job) | Negative balance, double escrow | `xmin` + transaction + unique `Escrows(JobId)` + `Conflict 409` retry |
| Hardcoded URL baked into EAS build | Demo fails on device | `EXPO_PUBLIC_API_BASE_URL` env at build time + `10.0.2.2` emulator switch, never commit URL |
| Marketplace cold-start (EXE201 orders) | No transaction bills | Sell `gói dịch vụ` where team = tasker; classmates as first customers; log every escrow as bill |
| Scope creep (real map, push, full i18n) | Miss 2w | Demo visual map; local notifications only; `vi` hardcoded; web admin stays display-only (task 12) |

---

## 13. Decisions — All Decided

1. **DB:** Neon Postgres only (dev+prod branches, `xmin` concurrency).
2. **Map:** demo visual + real `lat/lng`, no SDK/key.
3. **Upload:** `wwwroot/uploads` MVP (S3/Cloudinary deferred).
4. **State:** React Query (server) + context (session/UI) — replaces reducer internals, keeps hook surface.
5. **EXE201 track:** `Công nghệ/Dịch vụ` tech track (no inventory).
6. **Release:** EAS Build `preview` profile → APK.

No blocking items left.

---

## 14. Next Step

- **Repo bootstrap:** `Api/`, `app_mobile/`, `web/`, `docs/` with this doc as `docs/TECH_STACK_PLAN.md`.
- Begin task 00 (import demo) per `docs/BACKLOG.md` + `docs/tasks/*`.

*Generated: 2026-08-28. Updated for Expo pivot: 2026-09-13. Authors: GiGood rebuild team.*
*References: `origin/demo` `types/index.ts`, `lib/GiGoodContext.tsx`, `tailwind.config.js`, `app/(app)/_layout.tsx`*
