# 02 — Jobs CRUD + Categories + Image Upload + Seed

**Goal:** Persisted jobs (what demo called `finding`/`assigned`/`completed`), category chips, budget/location validation, image upload `wwwroot/uploads`, seed 2 jobs like `lib/seed.ts:INITIAL_JOBS`.

**Depends:** 00, 01. **Branch:** `feat/02-jobs` off `master`.

**API contract:**
- `GET /api/jobs?status&category&lat&lng&radius&q&cursor` -> paginated `200 {jobs, nextCursor}`.
- `POST /api/jobs {title, description, category:repair|cleaning|delivery|helper, price, lat?, lng?, locationText?, images?:string[]} -> 201 Job` validation `price>=10000`, `title>=5`.
- `GET /api/jobs/{id} -> 200` / `404`, `PATCH /api/jobs/{id} (owner only)`, `DELETE /api/jobs/{id}`.
- `POST /api/upload (multipart IFormFile) -> 200 {url:/uploads/{guid}.ext}` with `UseStaticFiles`, validation `image/*, max 5MB`.
- Entities `Jobs(Id Guid, OwnerId FK->Users, Title, Description, Category string, Price decimal, Status enum[Open/Assigned/Done/Cancelled], Lat double?, Lng double?, LocationText, CreatedAt, UpdatedAt, RowVersion)`, `JobImages(JobId, Url)`.
- Seed: `INITIAL_JOBS` id 201 `Khơi thông thoát sàn` repair 150k Q1 10.7769,106.7009 + id 202 `Giao bánh` delivery 45k, both `owner=seedUser`.

**Flutter:**
- `JobsBloc` events `LoadJobs, CreateJob, UpdateJob, DeleteJob, UploadImage` states `JobsInitial/Loading/Loaded(jobs)/Error`.
- `JobsApi`, `JobModel` freezed+json, `dio` multipart upload.
- Screens `post_page` (templates 4 quick cards 150k/200k/50k/120k -> prefill), category chips `CATEGORY_META` labels, budget number pad, location text + future map pick, `jobs_page` list with `StatusBadge` amber/blue/emerald, `detail_page`.

**Files to touch:**
- `Api/Features/Jobs/*`, `Api/Features/Upload/*`, `Api/Data/AppDbContext.cs` add DbSets, `Api/wwwroot/uploads/` ensure `Directory.CreateDirectory`.
- `app_flutter/lib/features/jobs/{data/*, presentation/bloc/jobs_bloc.dart, pages/post_page.dart, pages/jobs_page.dart, pages/detail_page.dart, widgets/job_card.dart}` reuse demo `JobCard` styling (`rounded-2xl`, orange/teal).

**Steps:**
1. Migration `JobsInit` + `JobImages` + indexes `OwnerId, Status, Category, CreatedAt`.
2. Endpoints `MapGroup("/api/jobs").RequireAuthorization()` + `ValidationFilter` per DTO + `TypedResults`.
3. Upload endpoint `DisableAntiforgery`, extension whitelist, guid filename.
4. Seed via `DbSeeder.SeedAsync()` on startup if `!Jobs.Any()`.
5. Flutter `post_page` validation `b<10000` toast error (same as demo), upload via `image_picker` + `FormData`, optimistic `Loaded`.
6. Replace demo `mapX/Y` `%` with `Lat/Lng double` throughout.

**Acceptance:**
- `curl POST /api/jobs` with Bearer -> 201 + row in DB; `GET /api/jobs` returns seed+new; `POST /api/upload` with image -> 200 url accessible at `/uploads/*`.
- Flutter: post job with template, list shows it, detail shows images, owner can edit/delete.

**Verification:**
```bash
dotnet ef migrations add JobsInit
dotnet build Api/
curl -s -H "Authorization: Bearer $AT" http://localhost:5000/api/jobs | jq .
flutter analyze
```

**Commit:** `feat(jobs): CRUD + upload + seed (#02)`
