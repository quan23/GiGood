# 07 — Two-Way Ratings + Reviews

**Goal:** Real ratings replacing fixed `rating5` on release, aggregate `RatingAvg`.

**Depends:** 02, 06. **Branch:** `feat/07-ratings` off `master`.

**API contract:**
- `POST /api/ratings {jobId, rate:1-5, comment?} -> 201 Review {id, jobId, reviewerId, rate, comment, createdAt}` validation `1<=rate<=5`, unique `Reviews(JobId, ReviewerId)` -> 409 on second, caller must be participant of job with `Job.Status Done`.
- `GET /api/ratings?jobId&userId&cursor -> 200 {reviews, nextCursor, avg}`.
- `GET /api/users/{id}/rating -> 200 {avg, count}` computed `AVG(rate)` or cached `Users.RatingAvg` updated after insert.
- Entity `Reviews(Id Guid, JobId FK, ReviewerId FK, Rate int CHECK, Comment string max 1000, CreatedAt)` unique index `JobId+ReviewerId`.

**Mobile (Expo):**
- `lib/features/ratings/hooks/useRatings.ts` + `StarRow` reused from demo `StarRow` (5 amber `#f59e0b` vs gray).
- `RatingSheet` bottom sheet with interactive `StarRow` + comment input + `Gửi đánh giá` button. Triggered after release (seeker rates tasker) + vice versa `RateTasker` flow in active screen -> `Báo đã hoàn thành`.
- profile screen shows `RatingAvg` `★ 4.9 · 120 việc`.

**Files to touch:**
- `Api/Features/Ratings/*`, `Api/Data/AppDbContext.cs`, `Api/Features/Jobs/JobsEndpoints.cs` auto-create `Review` on release if rating provided.
- `app_mobile/lib/features/ratings/{api.ts, types.ts, hooks/useRatings.ts, components/StarRow.tsx, components/RatingSheet.tsx}`, `app_mobile/lib/features/jobs/screens/jobs.tsx` wire sheet, `app_mobile/lib/features/tasker/screens/active.tsx`.

**Steps:**
1. Migration `RatingsInit` + `CHECK (Rate BETWEEN 1 AND 5)` + `AVG` recompute on `Users.RatingAvg` after insert.
2. Endpoints `RequireAuthorization`, verify `Job.Status==Done` and caller in job, prevent self-rate.
3. Expo `RatingSheet` modal same as demo `Rating` but with real `POST /ratings`, disable second submit.
4. Update history screen completed jobs show `seekerRating/taskerRating` stars readOnly.

**Acceptance:**
- Seeker releases job with `rating 5` -> `POST /ratings` creates review, `GET /users/:id/rating` avg updates, second `POST` for same job+reviewer -> 409.
- Tasker rates seeker similarly after `Active -> Báo hoàn thành`.

**Verification:**
```bash
dotnet build Api/
curl -H "Authorization: Bearer $AT" -X POST http://localhost:5000/api/ratings -H "Content-Type: application/json" -d "{\"jobId\":\"$JID\",\"rate\":5}" | jq .
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(ratings): two-way reviews + avg (#07)`
