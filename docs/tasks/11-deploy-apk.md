# 11 — Deploy (API + Web + EAS Preview APK) + API URL Switch

**Goal:** Hosted API + hosted web demo + EAS preview APK + env switch `10.0.2.2` <-> prod.

**Depends:** 00-10, 12. **Branch:** `feat/11-deploy` off `master`.

**API contract:** No code change, just infra.

**Deploy targets (all three, $0):**
- API: `Render free` web service from `Api/Dockerfile` (`dotnet publish -c Release -o out` + `ENTRYPOINT dotnet Api.dll`, `PORT=8080`, `ASPNETCORE_URLS=http://0.0.0.0:$PORT`). Free tier sleeps when idle (cold start 30-60s) — acceptable; upgrade before demo day if it hurts. `deploy/render.yaml` defines service + env (`ConnectionStrings__Default`, `Jwt__*`).
- DB: `Neon` free Postgres, `prod` branch (dev work stays on `dev` branch). Pooled connection string. Run `dotnet ef database update --connection <neon-prod>` once before first deploy.
- Web: `web/dist` (`npm run build`) as Render static site ($0), env `VITE_API_BASE_URL=https://<api>.onrender.com`.

**Expo release:**
- `app_mobile/eas.json` with a `preview` profile (`buildType: apk` for internal distribution) + `cli.appVersionSource` app config.
- `npx eas build --platform android --profile preview` -> installable APK artifact; share link/QR for the demo.
- Env switch: `EXPO_PUBLIC_API_BASE_URL` only. Dev emulator `http://10.0.2.2:5000`, iOS sim `http://localhost:5000`, prod preview `https://<render>.onrender.com`. Never hardcode; set via `eas.json` `env` for the preview profile. `EXPO_PUBLIC_USE_MOCK=0` for the hosted build.

**Files to touch:**
- `Api/Dockerfile`, `Api/.dockerignore`, `deploy/compose.yml` prod overlay `compose.prod.yml`, `deploy/render.yaml`, `.env.example` document `EXPO_PUBLIC_API_BASE_URL`, `VITE_API_BASE_URL`, `JWT__Key`, `ConnectionStrings__Default`.
- `app_mobile/eas.json`, `app_mobile/app.json` (android package + version), `app_mobile/lib/core/config/env.ts`.
- `README.md` add Deploy section (API URL + web URL + EAS preview + install steps).

**Steps:**
1. Create `Neon` project with `dev` + `prod` branches; set local `ConnectionStrings__Default` to `dev` pooled URL; run `dotnet ef database update` locally.
2. Run `dotnet ef database update --connection <neon-prod-url>` once to provision prod schema + seed.
3. `deploy/render.yaml`: API web service (build `dotnet publish Api/Api.csproj -c Release -o out`, start `dotnet out/Api.dll`, env `ASPNETCORE_URLS=http://0.0.0.0:$PORT` + `ConnectionStrings__Default` (prod) + `Jwt__*`) + static site (build `cd web && npm ci && npm run build`, publish `web/dist`, env `VITE_API_BASE_URL`).
4. Deploy, verify `https://<api>/health` + `/swagger` + `https://<web>` loads landing + admin login works.
5. Configure `app_mobile/eas.json` `preview` profile with `EXPO_PUBLIC_API_BASE_URL=https://<api>` and `EXPO_PUBLIC_USE_MOCK=0`; run `npx eas build --platform android --profile preview`; install the APK on a real device.
6. Document `curl` proof `POST /api/auth/login` against prod URL for report.

**Acceptance:**
- Prod `GET https://<api>/health` -> `200 ok`, `GET /swagger` shows Swashbuckle UI, prod `GET /api/jobs` with Bearer works.
- `https://<web>` serves landing; admin login (seeded admin) shows users/jobs/escrows/stats tables.
- EAS `preview` APK installs on an Android device, login + post job + chat works against prod URL (not `10.0.2.2`).

**Verification:**
```bash
curl -s https://<api>/health | grep ok
curl -s https://<api>/swagger | head
curl -s https://<web> | head
# on device: install the EAS preview APK -> login -> board -> accept -> chat
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `chore(deploy): render-free/neon + web static + eas preview apk (#11)`

**Post-task:** Tag `v0.1.0` `git tag -a v0.1.0 -m "2w MVP"` + push tag for the EXE201 submission zip: `git archive --format zip --output GiGood-v0.1.0.zip master`.

**Notes:** Keep `master` as deploy branch, `demo` stays old. `private/` never deployed.
