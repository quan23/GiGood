# 01 — Auth Register/Login/Refresh + JWT + SecureStore

**Goal:** Real phone/password auth, JWT 15m + opaque refresh 7d rotate-on-use (reuse-detection deferred per OPINIONS DeepSeek #4), axios interceptor 401→refresh→retry, `expo-secure-store` persistence. Wire the demo auth screens to the API.

**Depends:** 00. **Branch:** `feat/01-auth` off `master`.

**API contract:**
- `POST /api/auth/register {name, phone, password, location, role:seeker|tasker, taskerProfile?: {skills:Category[], bio, availability, vehicle}} -> 201 {user, accessToken, refreshToken, expiresIn}` validation `phone ^0\d{9}$`, `password >=6`.
- `POST /api/auth/login {phone,password} -> 200 {accessToken, refreshToken}`.
- `POST /api/auth/refresh {refreshToken} -> 200 {accessToken, refreshToken}` rotate-on-use: revoke old, issue new (family-revocation deferred).
- `POST /api/auth/revoke {refreshToken} -> 204` **anonymous** (auth via refresh token itself, not Bearer — avoids logout 401 loop), `GET /api/me -> 200 User+Wallet`.
- Entities `Users(Id Guid PK, Phone unique index, PasswordHash, Name, AvatarUrl, RatingAvg, CurrentRole, TaskerProfile JSON cols Skills/Bio/Availability/Vehicle/Verified, CreatedAt)`, `RefreshTokens(Id, UserId, TokenHash SHA256, ExpiresAt, RevokedAt?, ReplacedByToken?)`.
- JWT claims: `sub=User.Id`, `jti` separate Guid, `phone`, `role`. `TokenValidationParameters`: `RoleClaimType="role"`, `NameClaimType="sub"`, `ClockSkew=30s`. Role-sensitive endpoints check DB `CurrentRole`, not claim.

**Mobile (Expo):**
- `useAuth` keeps its demo surface: `{user, login, register, logout, switchRole}`; internal state via React Query mutations.
- `lib/features/auth/api.ts` axios calls; `expo-secure-store` keys `access_token`, `refresh_token`.
- `lib/core/api/client.ts` response interceptor on 401 (not `/auth/refresh`) -> `POST /auth/refresh` -> update SecureStore -> retry original -> else clear + redirect to welcome.
- Screens `Welcome -> RoleSelect -> SignupBasic -> SignupTaskerProfile -> Login` faithful to demo vi copy.

**Files to touch:**
- `Api/Features/Auth/*` (`AuthEndpoints.cs`, `Dtos.cs`, `JwtProvider.cs` HS256 32+ bytes, `PasswordHasher` BCrypt), `Api/Data/AppDbContext.cs` add DbSets, `Api/Program.cs` `AddJwtBearer ClockSkew 30s`.
- `app_mobile/lib/features/auth/{api.ts, types.ts, hooks/useAuth.ts, screens/*}`, `app_mobile/lib/core/api/interceptors.ts`, `app_mobile/lib/core/storage/secure-store.ts`.

**Steps:**
1. Migrations `dotnet ef migrations add AuthInit` -> `dotnet ef database update` (add `Users`, `RefreshTokens`).
2. `JwtProvider` `sub=User.Id, jti=Guid, phone, role, exp 15m, iss/aud`, `SymmetricSecurityKey` 32+ bytes (user-secrets/env, never committed).
3. Refresh: `RandomNumberGenerator.GetBytes(64)` base64url opaque, store `SHA256`, 7d, family revocation.
4. Endpoints with `FluentValidation`, `TypedResults`, `RequireAuthorization` for `/me`.
5. Expo: `expo-router` guard `token==null ? welcome`; quick-login cards `Khánh Vy`/`Minh Quân` call real login.

**Acceptance:**
- `curl -X POST /api/auth/register` -> 201 + tokens; login -> 200; `GET /api/me` with Bearer -> 200; without -> 401; refresh -> 200 new pair; logout via anonymous revoke works with expired AT.
- Expo: register seeker+tasker, login, kill app -> tokens persist in SecureStore, 401 auto-refresh, logout clears storage.

**Verification:**
```bash
dotnet ef migrations list
dotnet build Api/
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(auth): JWT+refresh+secure store (#01)`

**Notes:** `password` never logged. `CATEGORY_META`/`AVAILABILITY_LABEL` reused for tasker profile. Demo auth strings are hardcoded vi. See `docs/OPINIONS.md` GLM P1/P5/P6/P7.
