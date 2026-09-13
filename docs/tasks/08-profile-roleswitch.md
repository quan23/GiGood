# 08 — Profile Edit + Avatar + Role Switch + Verify Stub

**Goal:** Replace `placehold.co` avatars + `verified:false` constant with upload + editable profile + RBAC switch.

**Depends:** 01. **Branch:** `feat/08-profile` off `master`.

**API contract:**
- `GET /api/me -> 200 {user: {id, name, phone, location, role, avatarUrl, taskerProfile:{skills:Category[], bio, availability, vehicle, verified}, ratingAvg}}`.
- `PATCH /api/me {name?, location?, bio?, skills?, availability?, vehicle?, avatarUrl?} -> 200` validation `name>=2`.
- `POST /api/me/avatar (multipart) -> 200 {avatarUrl}` wraps `POST /api/upload` but sets `Users.AvatarUrl`.
- `POST /api/me/switch-role {role:seeker|tasker} -> 200 {role, token?}` (single user dual roles, no second register; if taskerProfile null and switching to tasker -> 400 "complete profile first").
- `POST /api/me/verify` stub -> `200 {verified:false}` placeholder (real KYC deferred).

**Mobile (Expo):**
- `useSeeker`/`useTasker` surfaces extended with profile state; `useAuth` gains `switchRole()`.
- `lib/features/profile/hooks/useProfile.ts` handles `loadProfile, updateProfile, uploadAvatar, switchRole`.
- profile screen avatar 64 `rounded-full` teal/orange border, `Đồng` tier, wallet cards, `skills` chips `CATEGORY_META`, `bio`, `availability/vehicle` labels, phone/location rows, `Đăng xuất` -> `revoke + clear SecureStore`.
- Header `SegmentedToggle` role switcher calls `POST /me/switch-role` + `router.replace(post|board)`.
- signup-tasker-profile reuses `CategoryGrid` 4 chips multi-select + `availability` dropdown + `vehicle` + ID placeholder banner.

**Files to touch:**
- `Api/Features/Users/*`, `Api/Features/Auth/*` switch endpoint, `Api/Data/AppDbContext.cs`.
- `app_mobile/lib/features/auth/hooks/useAuth.ts` add `switchRole`, `app_mobile/lib/features/profile/{screens/profile.tsx, hooks/useProfile.ts, components/AvatarPicker.tsx}`, `app_mobile/lib/hooks/useSeeker.ts`/`useTasker.ts` preserve surface.

**Steps:**
1. Migration if `TaskerProfile` columns missing (`Skills jsonb/string`, `Bio`, `Availability`, `Vehicle`, `Verified bool`).
2. Endpoints `RequireAuthorization`, verify taskerProfile exists before switch.
3. Expo `expo-image-picker` `launchImageLibraryAsync` -> `FormData` -> `POST /me/avatar` -> update user in query cache.
4. Wire `SegmentedToggle` 2 options `Người Thuê` orange vs `Người Nhận` teal active `bg-white shadow-sm`.

**Acceptance:**
- Edit name/location/bio -> `GET /me` returns new; upload avatar -> shows via `expo-image` without restart; switch role seeker<->tasker without logout; switching to tasker without profile blocks with toast `Vui lòng hoàn thành hồ sơ tasker`.

**Verification:**
```bash
dotnet build Api/
(cd app_mobile && npx tsc --noEmit)
curl -H "Authorization: Bearer $AT" -X PATCH http://localhost:5000/api/me -H "Content-Type: application/json" -d '{"name":"Vy 2"}' | jq .
```

**Commit:** `feat(profile): edit+avatar+role switch (#08)`
