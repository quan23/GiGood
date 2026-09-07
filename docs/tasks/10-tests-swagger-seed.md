# 10 — Tests + Swagger Scalar + Seed Polish

**Goal:** Satisfy PRM393 `1 Unit + 1 Widget` mandatory gates + grader-visible Swagger.

**Depends:** 01-08. **Branch:** `feat/10-tests` off `master`.

**API contract:**
- `GET /swagger` Scalar UI + `GET /openapi.json` + `GET /health`.
- No new endpoints; validate existing.

**Flutter tests:**
- Unit `test/unit/format_vnd_test.dart` `formatVnd(150000) == "150.000 VND"` + `test/unit/auth_bloc_test.dart` `blocTest<AuthBloc, AuthState>('login emits [Loading, Authenticated]' ...)` + `test/unit/wallet_ledger_test.dart` logic pure.
- Widget `test/widget/job_card_test.dart` `pump JobCard(job: fake)` -> `expect find.text title, expect budget`, `test/widget/chat_bubble_test.dart`, `test/widget/star_row_test.dart` interactive tap -> `onChange(3)`.
- Use `bloc_test`, `mocktail`, `fake_async` for timer-free radar test.
- Add `test/helpers/fake_jobs.dart` reused.

**Backend (optional BE test, not required but + points):**
- `Api.Tests/JwtProviderTests.cs` xUnit + `EscrowConcurrencyTests` with 2 parallel `Accept` -> one 409.

**Swagger/Seed:**
- `Program.cs` `app.MapOpenApi()` + Scalar `app.MapScalarApiReference("/swagger", o => o.WithTitle("GiGood API"))` (or `Swashbuckle` fallback). Ensure `RequireAuthorization` shows lock icon but allows `Authorize` Bearer.
- `Api/Data/Seeder.cs` polish: ensure 2 seed jobs + 3 `SAMPLE_TASKERS` avatars `https://placehold.co/100x100` + wallets `1_420_000 / 2_850_000 / escrow 150_000` on `if (!Users.Any())`, idempotent.

**Files to touch:**
- `Api/Program.cs`, `Api/Data/Seeder.cs`, `Api/Api.csproj` ensure `Microsoft.AspNetCore.OpenApi`.
- `app_mobile/test/{unit/*, widget/*, helpers/*}`, `app_mobile/pubspec.yaml` already has deps from 00.

**Steps:**
1. Add `builder.Services.AddOpenApi()` + `app.MapOpenApi()` + `app.MapScalarApiReference` (install `Scalar.AspNetCore` if needed).
2. Create `test/unit` 3 files + `test/widget` 3 files, run `flutter test --coverage`.
3. Run `dotnet test` if BE tests added else `dotnet build` only.
4. Verify `curl -s http://localhost:5000/openapi.json | jq .info.title`.

**Acceptance:**
- `flutter test` green >=5 tests, `flutter analyze` green, `dotnet build` green.
- `http://localhost:5000/swagger` shows `Auth, Jobs, Chat, Wallet, Ratings, Notifications, Upload` with Try-it + Bearer auth.
- Fresh DB `dotnet ef database update` seeds 2 jobs + wallets deterministically.

**Verification:**
```bash
dotnet build Api/
dotnet test Api.Tests/  # if exists
curl -s http://localhost:5000/health | grep ok
curl -s http://localhost:5000/openapi.json | head -20
flutter test
flutter analyze
```

**Commit:** `test(fe): unit+widget + swagger + seed (#10)`

**Notes:** Lecturer checks `test/` folder existence + `swagger` URL screenshotted in report. Do not aim for 80% coverage — demonstrate pattern.
