# 11 — Deploy (API + Web + APK) + --dart-define Switch

**Goal:** Hosted API + hosted web demo + `flutter build apk --release` + env switch `10.0.2.2` <-> prod.

**Depends:** 00-10, 12. **Branch:** `feat/11-deploy` off `master`.

**API contract:** No code change, just infra.

**Deploy targets (all three, $0):**
- API: `Render free` web service from `Api/Dockerfile` (`dotnet publish -c Release -o out` + `ENTRYPOINT dotnet Api.dll`, `PORT=8080`, `ASPNETCORE_URLS=http://0.0.0.0:$PORT`). Free tier sleeps when idle (cold start 30-60s) — acceptable for testing; upgrade to Starter $7 before demo day if it hurts. `deploy/render.yaml` defines service + env (`ConnectionStrings__Default`, `Jwt__*`).
- DB: `Neon` free Postgres, `prod` branch (dev work stays on `dev` branch). Pooled connection string. Run `dotnet ef database update --connection <neon-prod>` once before first deploy.
- Web: `web/dist` (`npm run build`) as Render static site ($0), env `VITE_API_BASE_URL=https://<api>.onrender.com`.

**Flutter release:**
- `keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
- `android/key.properties` (`storeFile=../upload-keystore.jks`, `storePassword`, `keyPassword`, `keyAlias=upload`) — gitignored via `.gitignore: **/upload-keystore.jks` already.
- `android/app/build.gradle` signing `release { keyAlias keyPassword storeFile storePassword }`.
- Build `flutter build apk --release --dart-define=API_BASE_URL=https://<render>.onrender.com` -> `build/app/outputs/flutter-apk/app-release.apk`. Also `flutter build appbundle` for store.
- Env switch: `lib/core/config/env.dart` const `apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:5000')` (emulator) vs `http://localhost:5000` iOS sim. Never hardcode.

**Files to touch:**
- `Api/Dockerfile`, `Api/.dockerignore`, `deploy/compose.yml` prod overlay `compose.prod.yml`, `deploy/render.yaml`, `.env.example` document `API_BASE_URL`, `VITE_API_BASE_URL`, `JWT__Key`, `ConnectionStrings__Default`.
- `app_mobile/android/app/build.gradle`, `app_mobile/android/key.properties` (create from `key.properties.example`), `app_mobile/lib/core/config/env.dart`.
- `README.md` add Deploy section (API URL + web URL + `Release APK` steps + `adb install`).

**Steps:**
1. Create `Neon` project with `dev` + `prod` branches; set local `ConnectionStrings__Default` to `dev` pooled URL; run `dotnet ef database update` locally.
2. Run `dotnet ef database update --connection <neon-prod-url>` once to provision prod schema + seed.
3. `deploy/render.yaml`: API web service (build `dotnet publish Api/Api.csproj -c Release -o out`, start `dotnet out/Api.dll`, env `ASPNETCORE_URLS=http://0.0.0.0:$PORT` + `ConnectionStrings__Default` (prod) + `Jwt__*`) + static site (build `cd web && npm ci && npm run build`, publish `web/dist`, env `VITE_API_BASE_URL`).
4. Deploy, verify `https://<api>/health` + `/swagger` + `https://<web>` loads landing + admin login works.
5. `flutter build apk --release --dart-define=API_BASE_URL=https://<api>` (from `app_mobile/`) test `adb install app_mobile/build/app/outputs/flutter-apk/app-release.apk` on real device.
6. Document `curl` proof `POST /api/auth/login` against prod URL for report.

**Acceptance:**
- Prod `GET https://<api>/health` -> `200 ok`, `GET /swagger` shows Swashbuckle UI, prod `GET /api/jobs` with Bearer works.
- `https://<web>` serves landing; admin login (seeded admin) shows users/jobs/escrows/stats tables.
- `app-release.apk` installs on Android device, login + post job + chat works against prod URL (not `10.0.2.2`).

**Verification:**
```bash
curl -s https://<api>/health | grep ok
curl -s https://<api>/swagger | head
curl -s https://<web> | head
adb install app_mobile/build/app/outputs/flutter-apk/app-release.apk
# on device: login -> board -> accept -> chat (2 phones or emulator+device)
flutter analyze
```

**Commit:** `chore(deploy): render-free/neon + web static + release apk (#11)`

**Post-task:** Tag `v0.1.0` `git tag -a v0.1.0 -m "2w MVP"` + push tag for PRM393 `30%` submission zip: `git archive --format zip --output GiGood-v0.1.0.zip master`.

**Notes:** Keep `master` as deploy branch, `demo` stays old. `private/` never deployed.
