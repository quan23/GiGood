# 08 — Profile Edit + Avatar + Role Switch + Verify Stub

**Goal:** Replace `placehold.co` avatars + `verified:false` constant with upload + editable profile + RBAC switch.

**Depends:** 01. **Branch:** `feat/08-profile` off `master`.

**API contract:**
- `GET /api/me -> 200 {user: {id, name, phone, location, role, avatarUrl, taskerProfile:{skills:Category[], bio, availability, vehicle, verified}, ratingAvg}}`.
- `PATCH /api/me {name?, location?, bio?, skills?, availability?, vehicle?, avatarUrl?} -> 200` validation `name>=2`.
- `POST /api/me/avatar (multipart) -> 200 {avatarUrl}` wraps `POST /api/upload` but sets `Users.AvatarUrl`.
- `POST /api/me/switch-role {role:seeker|tasker} -> 200 {role, token?}` (single user dual roles, no second register; if taskerProfile null and switching to tasker -> 400 "complete profile first").
- `POST /api/me/verify` stub -> `200 {verified:false}` placeholder (real KYC deferred).

**Flutter:**
- `ProfileBloc`/`Cubit` handles `LoadProfile, UpdateProfile, UploadAvatar, SwitchRole`.
- `profile_page` avatar 64 `rounded-full` teal/orange border, `Đồng` tier, wallet cards, `skills` chips `CATEGORY_META`, `bio`, `availability/vehicle` labels, phone/location rows, `Đăng xuất` -> `revoke + deleteAll`.
- Header `SegmentedToggle` role switcher calls `POST /me/switch-role` + `switchRole()` + `router.replace(post|board)` + `get_it` reset blocs.
- `signup-tasker-profile` reuse `CategoryGrid` 4 chips multi-select + `availability` dropdown + `vehicle` + ID placeholder banner.

**Files to touch:**
- `Api/Features/Users/*`, `Api/Features/Auth/*` switch endpoint, `Api/Data/AppDbContext.cs`.
- `app_mobile/lib/features/auth/presentation/bloc/auth_bloc.dart` add `SwitchRoleRequested`, `app_mobile/lib/features/profile/{pages/profile_page.dart, cubit/profile_cubit.dart, widgets/avatar_picker.dart}`, `app_mobile/lib/hooks/useAuth` ported to bloc.

**Steps:**
1. Migration if `TaskerProfile` columns missing (`Skills jsonb/string`, `Bio`, `Availability`, `Vehicle`, `Verified bool`).
2. Endpoints `RequireAuthorization`, verify taskerProfile exists before switch.
3. Flutter `image_picker` `pickImage(source: ImageSource.gallery)` -> `FormData` -> `POST /me/avatar` -> update `User` in `AuthBloc`.
4. Wire `SegmentedToggle` 2 options `Người Thuê` orange vs `Người Nhận` teal active `bg-white shadow-sm`.

**Acceptance:**
- Edit name/location/bio -> `GET /me` returns new; upload avatar -> shows `cached_network_image` without restart; switch role seeker<->tasker without logout; switching to tasker without profile blocks with toast `Vui lòng hoàn thành hồ sơ tasker`.

**Verification:**
```bash
dotnet build Api/
flutter analyze
curl -H "Authorization: Bearer $AT" -X PATCH http://localhost:5000/api/me -H "Content-Type: application/json" -d '{"name":"Vy 2"}' | jq .
```

**Commit:** `feat(profile): edit+avatar+role switch (#08)`
