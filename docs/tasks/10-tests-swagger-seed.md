# 10 — Jest Smoke Test + Swagger + Seed Polish

**Goal:** Exactly **1 Jest smoke test** + grader-visible Swagger + deterministic seed.

**Depends:** 01-08. **Branch:** `feat/10-tests` off `master`.

**API contract:**
- `GET /swagger` Swashbuckle UI + `GET /swagger/v1/swagger.json` + `GET /health`.
- No new endpoints; validate existing.

**Tests (exactly one):**
- `app_mobile/__tests__/smoke.test.tsx` — render the root/home screen (or `JobCard` with a fake job) with `@testing-library/react-native` and assert a known vi string renders. Configure `jest-expo` preset in `package.json` (`"test": "jest"`, `"jest": {"preset": "jest-expo"}`).
- Do not add a test suite beyond this one smoke test in this task.

**Swagger/Seed:**
- `Program.cs` Swashbuckle on .NET 8 (`Swashbuckle.AspNetCore`) at `/swagger`, `RequireAuthorization` shows lock icon but allows `Authorize` Bearer.
- `Api/Data/Seeder.cs` polish: ensure 2 seed jobs + 3 `SAMPLE_TASKERS` avatars `https://placehold.co/100x100` + wallets `1_420_000 / 2_850_000 / escrow 150_000` on `if (!Users.Any())`, idempotent.

**Files to touch:**
- `Api/Program.cs`, `Api/Data/Seeder.cs`, `Api/Api.csproj` ensure `Swashbuckle.AspNetCore`.
- `app_mobile/__tests__/smoke.test.tsx`, `app_mobile/package.json` add `jest`, `jest-expo`, `@testing-library/react-native` (dev only).

**Steps:**
1. Confirm Swashbuckle wired at `/swagger` with bearer security definition.
2. Add the single Jest smoke test and `jest-expo` config.
3. Run `dotnet build Api/` and `npm test` (app_mobile) to green.
4. Verify `curl -s http://localhost:5000/swagger/v1/swagger.json | jq .info.title`.

**Acceptance:**
- `npm test` (app_mobile) green with 1 smoke test; `npx tsc --noEmit` green; `dotnet build Api/` green.
- `http://localhost:5000/swagger` shows `Auth, Jobs, Chat, Wallet, Ratings, Notifications, Upload` with Try-it + Bearer auth.
- Fresh DB `dotnet ef database update` seeds 2 jobs + wallets deterministically.

**Verification:**
```bash
dotnet build Api/
curl -s http://localhost:5000/health | grep ok
curl -s http://localhost:5000/swagger/v1/swagger.json | head -20
(cd app_mobile && npm test)
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `test(fe): jest smoke + swagger + seed (#10)`

**Notes:** Lecturer checks `__tests__/` existence + the `swagger` URL screenshotted in the report. One smoke test demonstrates the pattern; do not chase coverage.
