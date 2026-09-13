# 03 — Geo Lat/Lng + Radius Query + Board Visual

**Goal:** Real `lat/lng double` geospatial search behind the demo board visual (fake grid + orange dots in `board` screen). **No map SDK** — the demo visual stays, now driven by real coordinates.

**Depends:** 02. **Branch:** `feat/03-geo` off `master`.

**API contract:**
- Same `GET /api/jobs?lat&lng&radius=km` now does bbox: `WHERE Lat BETWEEN :lat±delta AND Lng BETWEEN :lng±delta` sorted by Haversine `ORDER BY (lat-diff)^2 + (lng-diff)^2`. `radius` default 5km, max 50km.
- No new tables; reuse `Jobs.Lat/Lng`.

**Mobile (Expo):**
- Keep the demo board visual (`grid` + orange/teal dots). Project real `lat/lng` onto the visual with a simple linear mapping around the user's position (or Q1 center) — no map SDK, no native keys.
- `Board` screen: visual with `JobMarker` (orange seeker, teal tasker) + list `availableJobs` (`status Open` proximity ordered). Tap marker -> highlight list card + bottom sheet.
- Center on user via `expo-location` permission + `getCurrentPositionAsync`, fallback Q1 `10.7769,106.7009`.
- Keep `post` location picker: text + `Chọn vị trí` -> tap-on-visual returns `LatLng`.

**Files to touch:**
- `Api/Features/Jobs/JobsEndpoints.cs` add `lat/lng/radius` handling.
- `app_mobile/lib/features/jobs/screens/board.tsx` (demo visual + real coords), `app_mobile/lib/features/jobs/components/JobMap.tsx`, `app_mobile/app.json` add location permission copy, `app_mobile/package.json` add `expo-location`.

**Steps:**
1. Backend add query params parsing, delta approx `radius/111km`, `AsNoTracking`, index on `Lat/Lng`.
2. Expo: request foreground location permission; if denied fall back to Q1 center (no blocking).
3. Replace fake random dots with `jobs.map` projected to `lat/lng`; `onPress` -> `FlatList.scrollToIndex`.
4. Add `expo-location` and keep `EXPO_PUBLIC_USE_MOCK=1` returning seeded coords.

**Acceptance:**
- `GET /api/jobs?lat=10.7769&lng=106.7009&radius=2` returns jobs within 2km sorted nearest first.
- Board screen shows dots at projected real lat/lng, list order matches distance, tap scrolls list. Works offline with mock seed.

**Verification:**
```bash
curl -s "http://localhost:5000/api/jobs?lat=10.7769&lng=106.7009&radius=5" | jq .
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(geo): lat/lng radius search + board visual (#03)`

**Notes:** Defer PostGIS, defer geocoding (`locationText -> lat/lng`). No map SDK by design.
