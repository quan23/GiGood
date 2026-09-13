# 02 — Jobs CRUD + Categories + Image Upload + Seed (split 02a BE / 02b FE if 1d slips)

**Goal:** Persisted jobs (what demo called `finding`/`assigned`/`completed`), category chips, budget/location validation, image upload from `expo-image-picker` to `wwwroot/uploads` (whitelist image/* + 5MB cap + guid filename, served from wwwroot = stored-XSS surface, GLM P10), seed 2 jobs like `lib/seed.ts:INITIAL_JOBS`.

**Depends:** 00, 01. **Branch:** `feat/02-jobs` off `master`.

**API contract:**
- `GET /api/jobs?status&category&lat&lng&radius&q&cursor` -> paginated `200 {jobs, nextCursor}`.
- `POST /api/jobs {title, description, category:repair|cleaning|delivery|helper, price, lat?, lng?, locationText?, images?:string[]} -> 201 Job` validation `price>=10000`, `title>=5`.
- `GET /api/jobs/{id} -> 200` / `404`, `PATCH /api/jobs/{id} (owner only)`, `DELETE /api/jobs/{id}`.
- `POST /api/upload (multipart IFormFile) -> 200 {url:/uploads/{guid}.ext}` with `UseStaticFiles`, validation `image/*, max 5MB`.
- Entities `Jobs(Id Guid v7 `Guid.CreateVersion7()` for index-friendliness on Postgres; OwnerId FK->Users, Title, Description, Category string (+ Categories seed table, GLM P4), Price decimal, Status enum[Open/Assigned/Done/Cancelled] + `isCompletedReported` bool for report flow, Lat double?, Lng double?, LocationText, CreatedAt, UpdatedAt, ConcurrencyToken)`, `JobImages(JobId, Url)`. Geospatial: bbox filter in LINQ + in-memory Haversine sort (Haversine won't translate, GLM P10).
- Seed: `INITIAL_JOBS` id 201 `Khơi thông thoát sàn` repair 150k Q1 10.7769,106.7009 + id 202 `Giao bánh` delivery 45k, both `owner=seedUser`.

**Mobile (Expo):**
- `useJobs` keeps its demo surface: `{jobs, loading, createJob, updateJob, deleteJob, uploadImage}` backed by React Query.
- `lib/features/jobs/api.ts`, `JobModel` typed + zod-free TS types, `axios` multipart upload via `FormData`.
- Screens `post` (templates 4 quick cards 150k/200k/50k/120k -> prefill), category chips `CATEGORY_META` labels, budget number pad, location text + future map pick, jobs list with `StatusBadge` amber/blue/emerald, `detail` page.

**Files to touch:**
- `Api/Features/Jobs/*`, `Api/Features/Upload/*`, `Api/Data/AppDbContext.cs` add DbSets, `Api/wwwroot/uploads/` ensure `Directory.CreateDirectory`.
- `app_mobile/lib/features/jobs/{api.ts, types.ts, hooks/useJobs.ts, screens/post.tsx, screens/jobs.tsx, screens/[id].tsx, components/JobCard.tsx}` reuse demo `JobCard` styling (`rounded-2xl`, orange/teal).

**Steps:**
1. Migration `JobsInit` + `JobImages` + indexes `OwnerId, Status, Category, CreatedAt`.
2. Endpoints `MapGroup("/api/jobs").RequireAuthorization()` + `ValidationFilter` per DTO + `TypedResults`.
3. Upload endpoint `DisableAntiforgery`, extension whitelist, guid filename.
4. Seed via `DbSeeder.SeedAsync()` on startup if `!Jobs.Any()`.
5. Expo `post` validation `b<10000` toast error (same as demo), upload via `expo-image-picker` + `FormData`, optimistic query invalidation.
6. Replace demo `mapX/Y` `%` with `Lat/Lng double` throughout.

**Acceptance:**
- `curl POST /api/jobs` with Bearer -> 201 + row in DB; `GET /api/jobs` returns seed+new; `POST /api/upload` with image -> 200 url accessible at `/uploads/*`.
- Expo: post job with template, list shows it, detail shows images, owner can edit/delete. `EXPO_PUBLIC_USE_MOCK=1` still renders seed.

**Verification:**
```bash
dotnet ef migrations add JobsInit
dotnet build Api/
curl -s -H "Authorization: Bearer $AT" http://localhost:5000/api/jobs | jq .
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(jobs): CRUD + upload + seed (#02)`
