# 03 — Map Lat/Lng + Geospatial Query + Board UI

**Goal:** Real map replacing fake `grid+orange dots` in `board.tsx`, `lat/lng double` geospatial search.

**Depends:** 02. **Branch:** `feat/03-map` off `master`.

**API contract:**
- Same `GET /api/jobs?lat&lng&radius=km` now does bbox: `WHERE Lat BETWEEN :lat±delta AND Lng BETWEEN :lng±delta` sorted by Haversine `ORDER BY (lat-diff)^2 + (lng-diff)^2`. `radius` default 5km, max 50km.
- No new tables; reuse `Jobs.Lat/Lng`.

**Flutter:**
- Map dep choice: `google_maps_flutter` if `GOOGLE_MAPS_API_KEY` set else `flutter_map`+OSM (decide in task, don't block). `android/app/src/main/AndroidManifest.xml` + `ios/Runner` key placeholder.
- `BoardPage` = map `h-44` `GoogleMap` with markers `JobMarker` (orange seeker, teal tasker) + list `availableJobs` (`status Open` proximity ordered). Tap marker -> highlight list card + bottom sheet.
- Use `geolocator` or `expo-location` equivalent `geolocator` to center on user, fallback Q1 `10.7769,106.7009`.
- Keep `post_page` location picker: text + `Chọn vị trí trên bản đồ` -> map pick returns `LatLng`.

**Files to touch:**
- `Api/Features/Jobs/JobsEndpoints.cs` add `lat/lng/radius` handling.
- `app_flutter/lib/features/jobs/pages/board_page.dart` rewrite inline fake map, `app_flutter/lib/features/jobs/widgets/job_map.dart`, `android/app/src/main/AndroidManifest.xml`, `app_flutter/pubspec.yaml` already has dep.

**Steps:**
1. Backend add query params parsing, delta approx `radius/111km`, `AsNoTracking`, index already on `Lat/Lng`.
2. Flutter add `GOOGLE_MAPS_API_KEY` to `--dart-define` + manifest, conditional `if (apiKey.isEmpty) use flutter_map`.
3. Replace fake `View grid lines` with `GoogleMap(markers: jobs.map(...))` + `onMarkerTap -> ScrollController.animateTo`.
4. Location permission request + `Geolocator.getCurrentPosition`.

**Acceptance:**
- `GET /api/jobs?lat=10.7769&lng=106.7009&radius=2` returns jobs within 2km sorted nearest first.
- `BoardPage` shows map with pins at real lat/lng, list order matches distance, tap works, web build also shows map (or OSM fallback).

**Verification:**
```bash
curl -s "http://localhost:5000/api/jobs?lat=10.7769&lng=106.7009&radius=5" | jq .
flutter analyze
adb shell dumpsys | grep map  # visual
```

**Commit:** `feat(map): geospatial search + Board map (#03)`

**Notes:** Defer PostGIS, defer `geocoding` turn `locationText -> lat/lng`. Post-2w migrate to `PostGIS` if needed.
