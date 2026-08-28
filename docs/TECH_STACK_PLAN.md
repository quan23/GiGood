# GiGood Rebuild — Tech Stack Plan

> **Source:** `EXE101` demo `GiGood` (Expo SDK 54 + RN + NativeWind) used as Figma/spec only. Not a port. Full rebuild: **Flutter (FE) + .NET 8 (BE)** — keep tokens/flows, discard reducer/timers.
> **Constraints:** Old team, new project. Deadline 11 weeks, target delivery 2 weeks (vibe code). `vi` default, `en` secondary. `.NET` backend + `Flutter` frontend mandatory (PRM393 30% compliance). `EXE201` tech-track.
> **Status:** Draft for team confirmation. WBS will follow after approval.

---

## 1. Goals & Non-Goals

**Goals (2-week MVP must ship):**
- Real auth, persisted jobs, chat, map, wallet/escrow ledger, ratings, notifications, role switch, profile — replacing `lib/GiGoodContext.tsx` in-memory.
- PRM393 gates: DB/API, 10 screens (login, product list/detail, cart/escrow-checkout, notifications, map, chat, state mgmt), release APK, 1 unit + 1 widget test, Swagger/hosted URL.
- EXE201 tech-track: marketable product, channel metrics (FB/Tiktok/Web), transaction evidence via escrow.

**Non-Goals (post-2w):**
- Clean Architecture 4 projects, MediatR/CQRS, Azure SignalR Service, Blob Storage, SMS OTP, admin panel — all deferred.

**Principle:** Single-project vertical slice, explicit `flutter_bloc` (gradable), manual `Select` projections, `EF Core` direct.

---

## 2. High-Level Architecture

```
                ┌─────────────────┐
                │  Flutter App    │
                │  bloc + dio     │──────┐
                │  signalr_client │      │ HTTPS + JWT (15m) + Refresh (7d)
                └────────┬────────┘      │
                         │ SignalR WS    ▼
                ┌────────▼────────┐  ┌──────────────────┐
                │  FCM Push       │  │  .NET 8 Web API  │
                │  (killed-app)   │◄─┤  Minimal APIs    │
                └─────────────────┘  │  SignalR Hubs    │
                                     └──┬──────────┬────┘
                                        │ EF Core 8│
                          ┌─────────────▼──┐  ┌──▼──────────────┐
                          │ SQL Server     │  │ wwwroot/uploads │
                          │ (local dev)    │  │ (MVP static)    │
                          │ Postgres Neon  │  └─────────────────┘
                          │ (prod deploy)  │
                          └────────────────┘
```

- **Realtime:** SignalR `ChatHub` + `NotificationHub` for foreground. FCM (`firebase_messaging`) only for background/killed.
- **Why not Firebase/Supabase as primary:** PRM393 requires visible `.NET` DB/API; BaaS bypasses grading.

---

## 3. Frontend — Flutter

### 3.1 Version & Tooling

- **Flutter 3.22+ / Dart 3.4+,** `flutter_bloc 8.1.6`, `build_runner` + `freezed` + `json_serializable`, `get_it` + `injectable` (DI), `go_router 14`, `dio 5.4` + `pretty_dio_logger`, `flutter_secure_storage 9`, `easy_localization 3.0.7`, `signalr_netcore 1.3.6`, `google_maps_flutter 2.9` (or `flutter_map` if no API key), `cached_network_image`, `image_picker`, `intl`, `equatable`.

### 3.2 Why `flutter_bloc` (not Riverpod/Provider)

- PRM393 rubric says `Provider/Bloc` — `Bloc` = explicit `Event -> Bloc -> State -> BlocBuilder` = lecturer scores it. `bloc_test` trivial for required tests. AI generates boilerplate perfectly.
- Riverpod's `autoDispose` silently resets state; Provider too simple for chat/wallet. Use `Cubit` for simple screens (profile/filter), `Bloc` for chat/escrow.

### 3.3 Project Structure

```
lib/
  core/
    network/dio_client.dart          # QueuedInterceptorsWrapper: attach JWT, 401=>refresh=>retry
    di/injection.dart                # get_it + injectable
    router/app_router.dart           # go_router + auth redirect guard
    l10n/                            # easy_localization delegates
  features/
    auth/{data/{datasources/auth_api.dart, models/user_model.dart}, presentation/bloc/auth_bloc.dart, pages/login_page.dart}
    jobs/{data, presentation/bloc, pages/{post_page, board_page, jobs_page, detail_page}}
    chat/{hub/chat_hub_service.dart, bloc/chat_bloc.dart}
    wallet/{bloc/wallet_bloc.dart}   # escrow ledger
    rating, notifications, profile
  shared/widgets/{job_card.dart, chat_bubble.dart, star_row.dart}
assets/
  translations/vi.json  # default
  translations/en.json
test/
  unit/auth_bloc_test.dart
  widget/job_card_test.dart
```

### 3.4 Keep vs Discard from Demo

- **Keep as spec:** `tailwind.config.js` `orange #ea580c / teal #0f766e / rounded-2xl / stoneBorder` → `ThemeData` + `AppColors`; `Inter/Poppins` → `TextTheme`; `FontAwesome` → `font_awesome_flutter`; flows `Welcome→RoleSelect→SignupBasic→TaskerProfile→(post/jobs/chat/history|board/active/chat/earnings)`; `types/index.ts` shapes `Role/Category/Availability/Vehicle/JobStatus`; `CATEGORY_META`/`AVAILABILITY_LABEL`/`VEHICLE_LABEL`; `formatVnd` → `intl NumberFormat('vi_VN')`; `ToastVariant`.
- **Discard:** `lib/GiGoodContext.tsx` reducer + `nextJobId=300` + `lib/seed.ts` seeds; timers `setInterval 1s` radar / `Animated.loop` pulse / `Toast 2500ms`; `QUICK_LOGIN` hardcode; `mapX/Y %` → `double lat/lng`; single global `escrowHeldPool`.

### 3.5 State Slices

- `AuthBloc` — `AuthInitial/Loading/Authenticated(user)/Unauthenticated/Error` + events `LoginRequested, RegisterRequested, Logout, Refresh`.
- `JobsBloc` — `JobsLoad, PostJob, AcceptJob, ReportCompleted, ReleaseEscrow`.
- `ChatBloc` — `JoinJobGroup, SendMessage, ReceiveMessage, Typing`.
- `WalletBloc` — ledger view, balance via `GET /api/wallet/balance`.

### 3.6 Navigation

`go_router` declarative:
`/ (splash) → /welcome → /role-select → /signup-basic → /signup-tasker-profile → /(app)/post (seeker) | /(app)/board (tasker) -> /job/:id, /chat/:id, /profile, /notifications`. Guard: `redirect: (ctx, state) => token==null ? '/welcome' : null`.

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
Microsoft.EntityFrameworkCore.SqlServer
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

- **Dev:** SQL Server LocalDB/Express (`UseSqlServer`). **Prod:** Postgres Neon/Supabase (`UseNpgsql`) — EF Core 95% abstracted, switch via connection string. Lecturer-friendly SSMS locally, zero-license prod.
- **Migrations:** `dotnet ef migrations add Init` + `dotnet ef database update`. Keep migrations provider-agnostic (avoid `IDENTITY`/`jsonb` specifics in MVP).
- **Indexes:** `Jobs(OwnerId, Status, Category, CreatedAt)`, `Messages(ConversationId, CreatedAt)`, `Escrows(JobId)`.

### 4.5 Entity Summary (8 tables max)

```csharp
User { Id Guid, Phone string PK, PasswordHash, Name, AvatarUrl, RatingAvg double, CurrentRole string, CreatedAt }
Job { Id Guid, OwnerId FK, Title, Description, Category string, Price decimal, Status enum[Open/Assigned/Done/Cancelled], Lat double, Lng double, CreatedAt, RowVersion byte[] }
JobApplication { JobId FK, WorkerId FK, PriceOffer, Status, PK(JobId,WorkerId) }
Conversation { Id Guid, JobId FK, CreatedAt }
Message { Id Guid, ConversationId FK, SenderId FK, Body, CreatedAt }
Wallet { UserId PK FK, Balance decimal, RowVersion }
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
| POST | `/api/jobs/{id}/accept` | Yes (tasker) | lock with `RowVersion`, `Escrow Hold` tx |
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
- **Flutter client:** `HubConnectionBuilder().withUrl("$baseUrl/hubs/chat", options=>options.accessTokenFactory=()=>storage.read("access_token")).build()` (`signalr_netcore`). Auto-reconnect, groups `Clients.Group(jobId)`.

---

## 6. Auth & Security

- **Passwords:** `BCrypt` or `IPasswordHasher<User>` (cost 12). Store hash only.
- **JWT:** HS256, `sub=jti=Guid, phone, role`, 15m expiry, `Issuer=yourdomain, Audience=flutter`, `SymmetricSecurityKey` 32+ bytes. `TokenValidationParameters.ValidateIssuer/Audience/Lifetime/IssuerSigningKey, ClockSkew=30s`.
- **Refresh:** 64-char opaque `RandomNumberGenerator`, store `SHA256 hash`, 7d expiry, rotation: revoke old → issue new, reuse detection: if presented token already revoked/replaced → revoke entire family (steal).
- **Flutter storage:** `accessToken` in memory + `flutter_secure_storage` ; `refreshToken` only in secure storage (Keystore/Keychain, never `shared_preferences`).
- **Dio interceptor:** `QueuedInterceptorsWrapper` on 401 (not `/auth/refresh`) → `POST /auth/refresh` → update storage → `dio.fetch(original)` retry; on failure → `deleteAll + router.go('/login')`.

---

## 7. Internationalization

- `easy_localization` with `assets/translations/vi.json` fallback, `en.json` secondary. `MaterialApp(localizationsDelegates: context.localizationDelegates, supportedLocales: [Locale('vi'), Locale('en')], locale: Locale('vi'))`.
- Keys: `auth.login`, `jobs.post`, `jobs.board`, `wallet.escrow`, `chat.placeholder`, `rating.submit`, etc. Translate auth + job templates first for grading check.

---

## 8. Feature Deep-Dives

### 8.1 Map

- **Client:** `google_maps_flutter` (requires `GOOGLE_MAPS_API_KEY` in `android/app/src/main/AndroidManifest.xml` + `ios/Runner/AppDelegate`) or swap to `flutter_map` + OSM if key unavailable.
- **Data:** `Jobs.lat/lng double` (replaces `mapX/Y %`). Backend geospatial: `WHERE (Lat BETWEEN :lat±d) AND (Lng BETWEEN :lng±d)` plus `Haversine` ordering; add `PostGIS` later if needed.

### 8.2 Chat

- `Conversations` 1:1 per `Job` (or per seeker/tasker/job triple). `Messages` indexed pagination. Hub `JoinJobGroup` ensures only participants receive. Persist then broadcast: `db.Messages.Add(msg); await db.SaveChangesAsync(); await Clients.Group(jobId).SendAsync("ReceiveMessage", msg);`.

### 8.3 Escrow Ledger (Critical)

Never `wallet.Balance -= price` directly.

```
TopUp: WalletTransaction(+Amount) + Wallet.Balance += Amount
Create/Accept Job (Hold): Wallet.Balance -= Amount + WalletTransaction(-Hold, RefJobId) + Escrow(Held)   — in DB transaction + RowVersion check
Release (seeker confirms): Escrow.Status=Released + payee Wallet.Balance += Amount + WalletTransaction(+Release, payee)
Refund/Cancel: Escrow.Refunded + payer +Amount
```
```csharp
await using var tx = await db.Database.BeginTransactionAsync();
try {
  var wallet = await db.Wallets.FirstAsync(w=>w.UserId==payerId);
  if (wallet.Balance < amount) return TypedResults.BadRequest("Insufficient");
  wallet.Balance -= amount; // RowVersion concurrency
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

- **Config:** `API_BASE_URL` via `--dart-define=API_BASE_URL=https://api.yourdomain` (dev `http://10.0.2.2:5000` for emulator, `http://localhost:5000` for iOS sim). Never hardcode.
- **Hosting BE:** `Render Starter $7` or `Railway $5` (`git push` 3min, `dotnet publish -c Release -o out`, start `dotnet Api.dll`). Keep `Azure App Service F1 free` as backup for lecturer Microsoft-stack impression (needs AlwaysOn for SignalR). DB prod: `Neon` free Postgres (serverless, no 90d expiry).
- **CORS:** `AllowFlutterOrigin` + `AllowCredentials` for SignalR.
- **Flutter Release:** `keytool -genkey -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`, `android/key.properties`, `android/app/build.gradle` signing, `flutter build apk --release --dart-define=API_BASE_URL=...` → `build/app/outputs/flutter-apk/app-release.apk`. Test `adb install`. Also `flutter build web` for EXE201 channel demo if needed.
- **CI (optional):** GitHub Actions: `dotnet build/test` + `flutter analyze/test` on PR.

---

## 10. Testing (PRM393 Gate)

- **Unit (bloc_test + mocktail):**
```dart
blocTest<AuthBloc, AuthState>(
  'login emits [Loading, Authenticated]',
  build: () => AuthBloc(mockRepo),
  act: (b) => b.add(LoginRequested(phone: '0901234567', password: '123456')),
  expect: () => [AuthLoading(), isA<Authenticated>()],
);
```
`formatVnd` → `NumberFormat('vi_VN')` unit test.

- **Widget:**
```dart
testWidgets('JobCard renders', (t) async {
  await t.pumpWidget(MaterialApp(home: JobCard(job: fakeJob)));
  expect(find.text('Khơi thông thoát sàn'), findsOneWidget);
});
```
Target 5-10 tests — AI generates in 30min; lecturer checks folder existence, not coverage.

- **BE (optional):** `xUnit` for `JwtProvider` + `Escrow` concurrency, but Flutter tests satisfy PRM393 if time tight.

---

## 11. 2-Week Vibe Schedule (14 Days)

| Day | Deliverable | PRM393 Artifact | EXE201 Artifact |
|-----|-------------|-----------------|-----------------|
| D1 | Scaffold: `dotnet new webapi` + `flutter create` + `AppDbContext` + migrations + `Dio + go_router + secure_storage + easy_localization` | DB/API skeleton, Swagger | — |
| D2 | Auth: register/login/refresh/revoke + JWT + BCrypt + secure storage interceptor | Login screen, DB `Users/RefreshTokens` | — |
| D3 | Jobs CRUD + Categories + Upload + `POST /api/jobs` | Product list/detail | BMC + Category meta |
| D4 | Map `lat/lng` + Board list geospatial query | Map screen | **Outcome 1 draft:** MVP + 3 product levels + Financial plan |
| D5 | Chat REST + SignalR `ChatHub` + Flutter hub service | Chat + State mgmt | — |
| D6 | Notifications Hub + FCM stub + tray | Notifications screen | Channel setup FB/Insta/Tiktok |
| D7 | Wallet/Escrow ledger tx + `RowVersion` + balance/transactions endpoints | Billing/Checkout (escrow) + Cart (job selection) | Revenue KPI |
| D8 | Ratings (two-way) + `Review` + avg update | Rating | — |
| D9 | Profile + RoleSwitch (single user dual Roles) + edit + avatar upload | Role mgmt | Staffing plan |
| D10 | i18n `vi` + polish tokens (`orange/teal`, FontAwesome) + empty states | i18n | MKT content plan |
| D11 | Tests: 4 unit + 2 widget + Swagger Scalar + seed | Tests gate | Feedback form prep |
| D12 | Validation `FluentValidation`, error handling, pagination | Validation | Feedback >=20 mock |
| D13 | Deploy BE to Render + Neon + `flutter build apk --release` + `10.0.2.2`→prod URL | Hosted URL + APK | Deploy web demo |
| D14 | Demo script 15min + backup APK + recording + report outline | Demo + Report skeleton | Outcome 1 final PDF |

Buffer: if blocked, defer FCM (use foreground hub only) and Postgres PostGIS.

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flutter↔.NET JWT mismatch | 401 loop | Use HS256 + `accessTokenFactory`, test `curl` first, log `TokenValidationParameters` |
| Escrow race (2 taskers accept same job) | Negative balance, double escrow | `RowVersion` + transaction + unique `Escrows(JobId)` + `Conflict 409` retry |
| Hardcoded `localhost:5000` in APK | Demo fails on device | `--dart-define` + `10.0.2.2` emulator switch, never commit URL |
| Clean Arch over-engineering | -2 days | Stay single project; inject `AppDbContext` directly |
| Marketplace cold-start (EXE201 orders) | No transaction bills | Sell `gói dịch vụ` where team = tasker; classmates as first customers; log every escrow as bill |
| Scope creep (admin panel, OTP) | Miss 2w | Defer admin/OTP to post-MVP; `verified=false` placeholder suffices |

---

## 13. Decisions — Confirm with Team (blocking WBS)

1. **DB prod:** Keep SQL Server everywhere (simpler) or switch prod to Postgres Neon (free, no license)?
2. **Map:** `google_maps_flutter` (needs API key, better) vs `flutter_map` OSM (free, no key)?
3. **Upload:** `wwwroot/uploads` MVP acceptable or require S3/Cloudinary day-1?
4. **State granularity:** `Cubit` for profile/filter + `Bloc` for chat/wallet — agreed?
5. **EXE201 track:** Confirm `Công nghệ/Dịch vụ` (no inventory) vs `Vật lý` — tech = GiGood fits without stock.
6. **Who owns BE vs FE vibe prompts:** Prefix `Act as senior .NET 8 + Flutter bloc. Generate minimal code, no extra abstraction, ask before adding package.` — share?

---

## 14. Next Step

If team approves this stack:
- **WBS Phase:** L1 `Initiating` → L2 `Planning` → L3/L4 work packages with `Responsibility Assignment Matrix (RAM)` per FPT `PMG393` Ch.5 Pinto p.172/199 — pre-mapped to 2-week sprints + EXE201 outcomes.
- **Repo bootstrap:** `Api/`, `app_flutter/`, `docs/` with this doc as `docs/TECH_STACK_PLAN.md`.

> **Approval:** Reply `Approved` or comment on decisions 1-6. Changes will be versioned `v1.1`.

*Generated: 2026-08-28. Authors: GiGood rebuild team.*
*References: `GiGood/types/index.ts`, `GiGood/lib/GiGoodContext.tsx`, `GiGood/tailwind.config.js`, `GiGood/app/(app)/_layout.tsx`*
