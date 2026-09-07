# 01 — Auth Register/Login/Refresh + JWT + Secure Storage

**Goal:** Real phone/password auth, JWT 15m + opaque refresh 7d rotate-on-use (reuse-detection deferred per OPINIONS DeepSeek #4), `flutter_secure_storage` interceptor 401→refresh→retry. Fixes GLM P1/P5/P6/P7.

**Depends:** 00. **Branch:** `feat/01-auth` off `master`.

**API contract:**
- `POST /api/auth/register {name, phone, password, location, role:seeker|tasker, taskerProfile?: {skills:Category[], bio, availability, vehicle}} -> 201 {user, accessToken, refreshToken, expiresIn}` validation `phone ^0\d{9}$`, `password >=6`.
- `POST /api/auth/login {phone,password} -> 200 {accessToken, refreshToken}`.
- `POST /api/auth/refresh {refreshToken} -> 200 {accessToken, refreshToken}` rotate-on-use: revoke old, issue new (family-revocation deferred).
- `POST /api/auth/revoke {refreshToken} -> 204` **anonymous** (auth via refresh token itself, not Bearer — avoids logout 401 loop, GLM P7), `GET /api/me -> 200 User+Wallet`.
- Entities `Users(Id Guid PK, Phone unique index — NOT second PK per GLM P5, PasswordHash, Name, AvatarUrl, RatingAvg, CurrentRole, TaskerProfile JSON cols Skills/Bio/Availability/Vehicle/Verified, CreatedAt)`, `RefreshTokens(Id, UserId, TokenHash SHA256, ExpiresAt, RevokedAt?, ReplacedByToken?)`.
- JWT claims: `sub=User.Id` (**not** per-token Guid, GLM P1), `jti` separate Guid, `phone`, `role`. `TokenValidationParameters`: `RoleClaimType="role"`, `NameClaimType="sub"`, `ClockSkew=30s`. Role-sensitive endpoints check DB `CurrentRole`, not claim (GLM P6).

**Flutter:**
- `AuthBloc` states `Initial/Loading/Authenticated(user)/Unauthenticated/Error` events `RegisterRequested, LoginRequested, LogoutRequested, RefreshRequested`.
- `AuthApi` via `dio`, `flutter_secure_storage` keys `access_token`, `refresh_token`.
- `DioClient` `QueuedInterceptorsWrapper` on 401 (not `/auth/refresh`) -> `POST /auth/refresh` -> update storage -> `dio.fetch(original)` -> else deleteAll + `goRouter.go('/welcome')`.
- Screens `Welcome -> RoleSelect -> SignupBasic -> SignupTaskerProfile -> Login` faithful to demo copy.

**Files to touch:**
- `Api/Features/Auth/*` (`AuthEndpoints.cs`, `Dtos.cs`, `JwtProvider.cs` HS256 32+ bytes, `PasswordHasher` BCrypt), `Api/Data/AppDbContext.cs` add DbSets, `Program.cs` `AddJwtBearer ClockSkew 30s`.
- `app_mobile/lib/features/auth/{data/datasources/auth_api.dart, data/models/user_model.dart, presentation/bloc/auth_bloc.dart, pages/*}` + `app_mobile/lib/core/network/dio_client.dart` interceptor.

**Steps:**
1. Migrations `dotnet ef migrations add AuthInit` -> `dotnet ef database update` (add `Users`, `RefreshTokens`).
2. `JwtProvider` `sub=User.Id, jti=Guid, phone, role, exp 15m, iss/aud`, `SymmetricSecurityKey` 32+ bytes (user-secrets/env, never committed).
3. Refresh: `RandomNumberGenerator.GetBytes(64)` base64url opaque, store `SHA256`, 7d, family revocation.
4. Endpoints with `FluentValidation`, `TypedResults`, `RequireAuthorization` for `/me`.
5. Flutter `go_router` guard `token==null ? /welcome : null`, quick-login cards `Khánh Vy`/`Minh Quân` call real login.

**Acceptance:**
- `curl -X POST /api/auth/register` -> 201 + tokens; login -> 200; `GET /api/me` with Bearer -> 200; without -> 401; refresh -> 200 new pair; logout via anonymous revoke works with expired AT.
- Flutter: register seeker+tasker, login, kill app -> tokens persist, 401 auto-refresh, logout clears storage.
- Ships `test/unit/auth_bloc_test.dart` in THIS task (not deferred to 10, Qwen critique).

**Verification:**
```bash
dotnet ef migrations list
dotnet build Api/
flutter test test/unit/auth_bloc_test.dart
flutter analyze
```

**Commit:** `feat(auth): JWT+refresh+secure storage (#01)`

**Notes:** `password` never logged. `CATEGORY_META`/`AVAILABILITY_LABEL` reused for tasker profile. Write `vi` keys `auth.*` inline now (09 = sweep only). See `docs/OPINIONS.md` GLM P1/P5/P6/P7.
