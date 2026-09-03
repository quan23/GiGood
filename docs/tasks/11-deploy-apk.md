# 11 — Deploy + Release APK + --dart-define Switch

**Goal:** Hosted URL for demo day + `flutter build apk --release` + env switch `10.0.2.2` <-> prod.

**Depends:** 00-10. **Branch:** `feat/11-deploy` off `master`.

**API contract:** No code change, just infra.

**Deploy targets (pick 1 BE + 1 DB per TECH_STACK_PLAN §9):**
- BE: `Render Starter $7` (no sleep) or `Railway $5` via `git push`. Keep `Azure App Service F1 free` backup. `Dockerfile` already from 00: `dotnet publish -c Release -o out` + `ENTRYPOINT dotnet Api.dll` `PORT=8080`.
- DB prod: `Neon` free Postgres (branch `neon/prod` connection `Host=...`) or `Supabase`. Local dev stays SQL Server `LocalDB` (switch via `ConnectionStrings__Default` env). `Npgsql` provider handles prod.
- FE web demo (optional for EXE201 channels): `flutter build web --dart-define=API_BASE_URL=https://api.yourdomain`.

**Flutter release:**
- `keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
- `android/key.properties` (`storeFile=../upload-keystore.jks`, `storePassword`, `keyPassword`, `keyAlias=upload`) — gitignored via `.gitignore: **/upload-keystore.jks` already.
- `android/app/build.gradle` signing `release { keyAlias keyPassword storeFile storePassword }`.
- Build `flutter build apk --release --dart-define=API_BASE_URL=https://<render>.onrender.com` -> `build/app/outputs/flutter-apk/app-release.apk`. Also `flutter build appbundle` for store.
- Env switch: `lib/core/config/env.dart` const `apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:5000')` (emulator) vs `http://localhost:5000` iOS sim. Never hardcode.

**Files to touch:**
- `Api/Dockerfile`, `Api/.dockerignore`, `deploy/compose.yml` prod overlay `compose.prod.yml`, `deploy/render.yaml` or `railway.json`, `.env.example` document `API_BASE_URL`, `JWT__Key`, `ConnectionStrings__Default`.
- `android/app/build.gradle`, `android/key.properties` (create from `key.properties.example`), `app_flutter/lib/core/config/env.dart`.
- `README.md` add Deploy section `Release APK` steps + `adb install`.

**Steps:**
1. Create `Neon` project + `ConnectionStrings__Default` `Host=...` + run `dotnet ef database update --connection <neon>` locally once.
2. `render.yaml` build `dotnet publish Api/Api.csproj -c Release -o out` start `dotnet out/Api.dll` env `ASPNETCORE_URLS=http://0.0.0.0:$PORT` + `ConnectionStrings__Default` + `Jwt__*`.
3. Deploy, verify `https://<api>/health` + `/swagger`.
4. `flutter build apk --release --dart-define=API_BASE_URL=https://<api>` test `adb install build/app/outputs/flutter-apk/app-release.apk` on real device.
5. Document `curl` proof `POST /api/auth/login` against prod URL for report.

**Acceptance:**
- Prod `GET https://<api>/health` -> `200 ok`, `GET /swagger` shows Scalar, prod `GET /api/jobs` with Bearer works.
- `app-release.apk` installs on Android device, login + post job + chat works against prod URL (not `10.0.2.2`).
- `flutter build web` (if built) serves on `https://<web>` with same prod API.

**Verification:**
```bash
curl -s https://<api>/health | grep ok
curl -s https://<api>/swagger | head
adb install build/app/outputs/flutter-apk/app-release.apk
# on device: login -> board -> accept -> chat (2 phones or emulator+device)
flutter analyze
```

**Commit:** `chore(deploy): render/neon + release apk + env switch (#11)`

**Post-task:** Tag `v0.1.0` `git tag -a v0.1.0 -m "2w MVP"` + push tag for PRM393 `30%` submission zip: `git archive --format zip --output GiGood-v0.1.0.zip master`.

**Notes:** Keep `master` as deploy branch, `demo` stays old. `private/` never deployed.
