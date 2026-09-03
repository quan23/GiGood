# 01 — Auth Register/Login/Refresh + JWT + Secure Storage

**Goal:** Real phone/password auth, JWT 15m + refresh 7d rotation with reuse detection, `flutter_secure_storage` interceptor 401→refresh→retry.

**Depends:** 00. **Branch:** `feat/01-auth` off `master`.

**API contract:**
- `POST /api/auth/register {name, phone, password, location, role:seeker|tasker, taskerProfile?: {skills:Category[], bio, availability, vehicle}} -> 201 {user, accessToken, refreshToken, expiresIn}` validation `phone ^0\d{9}$`, `password >=6`.
- `POST /api/auth/login {phone,password} -> 200 {accessToken, refreshToken}`.
- `POST /api/auth/refresh {refreshToken} -> 200 {accessToken, refreshToken}` rotation: revoke old, issue new, if reused -> revoke family `401`.
- `POST /api/auth/revoke {refreshToken} -> 204`, `GET /api/me -> 200 User+Wallet`.
- Entities `Users(Id Guid, Phone unique, PasswordHash, Name, AvatarUrl, RatingAvg, CurrentRole, CreatedAt)`, `RefreshTokens(Id, UserId, TokenHash SHA256, ExpiresAt, RevokedAt?, ReplacedByToken?)`.

**Flutter:**
- `AuthBloc` states `Initial/Loading/Authenticated(user)/Unauthenticated/Error` events `RegisterRequested, LoginRequested, LogoutRequested, RefreshRequested`.
- `AuthApi` via `dio`, `flutter_secure_storage` keys `access_token`, `refresh_token`.
- `DioClient` `QueuedInterceptorsWrapper` on 401 (not `/auth/refresh`) -> `POST /auth/refresh` -> update storage -> `dio.fetch(original)` -> else deleteAll + `goRouter.go('/welcome')`.
- Screens `Welcome -> RoleSelect -> SignupBasic -> SignupTaskerProfile -> Login` faithful to demo copy.

**Files to touch:**
- `Api/Features/Auth/*` (`AuthEndpoints.cs`, `Dtos.cs`, `JwtProvider.cs` HS256 32+ bytes, `PasswordHasher` BCrypt), `Api/Data/AppDbContext.cs` add DbSets, `Program.cs` `AddJwtBearer ClockSkew 30s`.
- `app_flutter/lib/features/auth/{data/datasources/auth_api.dart, data/models/user_model.dart, presentation/bloc/auth_bloc.dart, pages/*}` + `app_flutter/lib/core/network/dio_client.dart` interceptor.

**Steps:**
1. Migrations `dotnet ef migrations add AuthInit` -> `dotnet ef database update` (add `Users`, `RefreshTokens`).
2. `JwtProvider` `sub=jti=Guid, phone, role, exp 15m, iss/aud`, `SymmetricSecurityKey`.
3. Refresh: `RandomNumberGenerator.GetBytes(64)` base64url opaque, store `SHA256`, 7d, family revocation.
4. Endpoints with `FluentValidation`, `TypedResults`, `RequireAuthorization` for `/me`.
5. Flutter `go_router` guard `token==null ? /welcome : null`, quick-login cards `Khánh Vy`/`Minh Quân` call real login.

**Acceptance:**
- `curl -X POST /api/auth/register` -> 201 + tokens; login -> 200; `GET /api/me` with Bearer -> 200; without -> 401; refresh -> 200 new pair; reused refresh -> 401 + family revoked.
- Flutter: register seeker+tasker, login, kill app -> tokens persist, 401 auto-refresh, logout clears storage.

**Verification:**
```bash
dotnet ef migrations list
dotnet build Api/
flutter test --run-skipped  # trap: add AuthBloc blocTest before
flutter analyze
```

**Commit:** `feat(auth): JWT+refresh+secure storage (#01)`

**Notes:** `password` never logged. `CATEGORY_META`/`AVAILABILITY_LABEL` reused for tasker profile. Keep `vi` keys `auth.*`.
