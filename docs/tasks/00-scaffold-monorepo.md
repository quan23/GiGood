# 00 — Scaffold Monorepo + Compose + Env

**Goal:** Runnable monorepo skeleton so every later task has `dotnet run` + `flutter run` + `docker compose up` working day 0.

**Depends:** — (first). **Branch:** `feat/00-scaffold` off `master`.

**Stack:** Keep `docs/TECH_STACK_PLAN.md` §3-9. Single-project .NET 8 Minimal APIs vertical slice, Flutter `flutter_bloc`.

**Files to touch:**
- `Api/Api.csproj`, `Api/Program.cs`, `Api/appsettings.json`, `Api/appsettings.Development.json`, `Api/Data/AppDbContext.cs`, `Api/Dockerfile`, `Api/.dockerignore`
- `app_mobile/pubspec.yaml`, `app_mobile/lib/core/*`, `app_mobile/analysis_options.yaml`
- `deploy/compose.yml`, `deploy/.env.example`, `.env.example`
- `.editorconfig`, `README.md` update clone steps

**Steps:**
1. `dotnet new webapi -n Api -o Api --framework net8.0` then edit to Minimal APIs groups + Swagger **Swashbuckle on .NET 8** (`Swashbuckle.AspNetCore`, NOT Scalar OpenApi which is .NET 9 — GLM P9), `AddDbContext`, `AddAuthentication JwtBearer` (+ `OnMessageReceived` query-token for `/hubs/*`, GLM P2), `AddSignalR` (in-box, no NuGet — GLM P9), `UseStaticFiles` for `wwwroot/uploads`, CORS `AllowFlutterOrigin + AllowCredentials`.
2. `AppDbContext` empty DbSets for Users/Jobs/Wallets etc (commented `// TODO task 01-06`), `options.UseNpgsql` only (Neon Postgres, decided — no SQL Server anywhere). `ConnectionStrings:Default` = Neon pooled string; `dev` branch locally, `prod` branch via env override.
3. `flutter create --platforms android,ios app_mobile` (no web platform — web is Vite `web/`, task 12). Add deps: `flutter_bloc`, `freezed_annotation`, `json_annotation`, `dio`, `go_router`, `flutter_secure_storage`, `easy_localization`, `signalr_netcore`, `flutter_map` default (swap to `google_maps_flutter` later when API key lands — Qwen map-key risk), `cached_network_image`, `image_picker`, `intl`, `equatable`, `get_it`, `injectable`, dev `build_runner`, `freezed`, `json_serializable`, `bloc_test`, `mocktail`. Add `analysis_options.yaml` strict. Also owns `/(app)` tab shell + role-switch redirect (Qwen nav-shell owner) + `FakeJobsRepo` behind get_it so FE runs ahead of BE (Qwen FE/BE split).
4. `app_mobile/lib/core/network/dio_client.dart` stub with `QueuedInterceptorsWrapper` (no refresh yet), `app_mobile/lib/core/di/injection.dart` get_it, `app_mobile/lib/core/router/app_router.dart` go_router with `/welcome` stub + guard `token==null ? /welcome`.
5. `app_mobile/assets/translations/vi.json` `{ "app.name": "GiGood" }`, `en.json` mirror, `MaterialApp(localizationsDelegates: context.localizationDelegates)` wiring.
6. `deploy/compose.yml` service `api (build: ../Api)` only (DB is Neon cloud, not compose) + optional `db (postgres:16)` profile `offline` for no-network dev + `deploy/.env.example` (`ConnectionStrings__Default` = Neon pooled URL, `Jwt__Key 32+`, `Jwt__Issuer`, `Jwt__Audience`). `.env.example` at repo root mirror.
7. `.editorconfig` + `global.json` `sdk:8.0.*`.

**API contract:** `GET /health` -> `200 {status:"ok"}` + `GET /swagger` Scalar + `GET /api/jobs` 401 without token (guard).

**Flutter Bloc:** None yet.

**Acceptance:**
- `dotnet build Api/` passes, `dotnet run --project Api` serves `http://localhost:5000/health` + `/swagger`.
- `flutter analyze` passes, `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000` shows welcome stub.
- `docker compose -f deploy/compose.yml up --build` starts db+api locally (api waits for db).

**Verification:**
```bash
dotnet build Api/
curl -s http://localhost:5000/health | grep ok
flutter analyze
```

**Commit:** `feat(scaffold): monorepo Api+app_mobile+compose (#00)` — push to `master`.

**Notes:** Do not add Clean Arch/MediatR. Neon Postgres only (`Npgsql`), `xmin` concurrency from day 1. Map key placeholder `GOOGLE_MAPS_API_KEY=__FILL__`.
