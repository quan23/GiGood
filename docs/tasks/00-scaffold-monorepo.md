# 00 — Scaffold Monorepo + Compose + Env

**Goal:** Runnable monorepo skeleton so every later task has `dotnet run` + `npx expo start` + `docker compose up` working day 0. Import the `origin/demo` Expo app into `app_mobile/` as the starting shell.

**Depends:** — (first). **Branch:** `feat/00-scaffold` off `master`.

**Stack:** Keep `docs/TECH_STACK_PLAN.md` §3-9. Single-project .NET 8 Minimal APIs vertical slice; `app_mobile/` = Expo SDK 54 + expo-router 5 + NativeWind 4 + TS, refactor of `origin/demo` with the hook surface kept stable (`useAuth`/`useJobs`/`useChat`/`useWallet`/`useSeeker`/`useTasker`/`useNotifications`/`useUi`) so screens stay unchanged.

**Files to touch:**
- `Api/Api.csproj`, `Api/Program.cs`, `Api/appsettings.json`, `Api/appsettings.Development.json`, `Api/Data/AppDbContext.cs`, `Api/Dockerfile`, `Api/.dockerignore`
- `app_mobile/` (imported from `origin/demo`), `app_mobile/app.json`, `app_mobile/package.json`, `app_mobile/tsconfig.json`, `app_mobile/lib/core/*`
- `deploy/compose.yml`, `deploy/.env.example`, `.env.example`
- `.editorconfig`, `README.md` update clone steps

**Steps:**
1. `dotnet new webapi -n Api -o Api --framework net8.0` then edit to Minimal APIs groups + Swagger **Swashbuckle on .NET 8** (`Swashbuckle.AspNetCore`), `AddDbContext`, `AddAuthentication JwtBearer` (+ `OnMessageReceived` query-token for `/hubs/*`), `AddSignalR`, `UseStaticFiles` for `wwwroot/uploads`, CORS `AllowExpoOrigin + AllowCredentials`.
2. `AppDbContext` empty DbSets for Users/Jobs/Wallets etc (commented `// TODO task 01-06`), `options.UseNpgsql` only (Neon Postgres, decided). `ConnectionStrings:Default` = Neon pooled string; `dev` branch locally, `prod` branch via env override. Map `xmin` concurrency from day 1.
3. Import `origin/demo` into `app_mobile/` (git subtree or archive) — keep expo-router file routes + hook surface. Add `axios` + `@tanstack/react-query` + `expo-secure-store`. Keep NativeWind 4. Mock flag `EXPO_PUBLIC_USE_MOCK=1` keeps `lib/seed.ts` active so the app runs offline ahead of the API.
4. `app_mobile/lib/core/api/client.ts` axios instance with `baseURL = process.env.EXPO_PUBLIC_API_BASE_URL`; `app_mobile/lib/core/query/queryClient.ts`; `app_mobile/lib/core/storage/secure-store.ts` wrapper over SecureStore.
5. `app_mobile/app/_layout.tsx` wraps `QueryClientProvider` + nav shell tabs + login guard redirect. Define mobile env: `EXPO_PUBLIC_API_BASE_URL` (dev `http://10.0.2.2:5000` emulator, `http://localhost:5000` iOS sim) and `EXPO_PUBLIC_USE_MOCK`.
6. `deploy/compose.yml` service `api (build: ../Api)` only (DB is Neon cloud, not compose) + optional `db (postgres:16)` profile `offline` for no-network dev + `deploy/.env.example` (`ConnectionStrings__Default` = Neon pooled URL, `Jwt__Key 32+`, `Jwt__Issuer`, `Jwt__Audience`). `.env.example` at repo root mirror.
7. `.editorconfig` + `global.json` `sdk:8.0.*`.

**API contract:** `GET /health` -> `200 {status:"ok"}` + `GET /swagger` Swashbuckle + `GET /api/jobs` 401 without token (guard).

**Mobile (Expo):** No feature hooks wired yet; shell + query client + mock switch only.

**Acceptance:**
- `dotnet build Api/` passes, `dotnet run --project Api` serves `http://localhost:5000/health` + `/swagger`.
- `cd app_mobile && npx tsc --noEmit` passes; `npx expo start` with `EXPO_PUBLIC_API_BASE_URL` shows the nav shell; `EXPO_PUBLIC_USE_MOCK=1` renders `lib/seed.ts` offline.
- `docker compose -f deploy/compose.yml up --build` starts api locally (and db with `--profile offline`).

**Verification:**
```bash
dotnet build Api/
curl -s http://localhost:5000/health | grep ok
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(scaffold): monorepo Api+app_mobile+compose (#00)` — push to `master`.

**Notes:** Do not add Clean Arch/MediatR. Neon Postgres only (`Npgsql`), `xmin` concurrency from day 1. Map = demo visual + real lat/lng, no map SDK (task 03).
