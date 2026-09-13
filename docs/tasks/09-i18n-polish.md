# 09 — vi-only Polish + Design Tokens + Empty States

**Goal:** Polish the Expo app to demo fidelity before tests/deploy. **No i18n sweep** — the demo strings are hardcoded vi and no translation keys ever existed. Ship design tokens, consistent empty states, and small a11y fixes.

**Depends:** 01-08. **Branch:** `feat/09-polish` off `master`.

**API contract:** None (frontend only).

**Mobile (Expo):**
- Demo copy stays hardcoded vi (`Đăng việc & Tìm Tasker ngay`, `Đang tìm Tasker phù hợp`, `Ký quỹ an toàn`, etc. from demo `CATEGORY_META`/`AVAILABILITY_LABEL`/`VEHICLE_LABEL`). Do not introduce a translation library.
- Tokens in `app_mobile/lib/core/theme/theme.ts` + NativeWind config: `orange #ea580c / orangeHover #c2410c / orangeLight #ffedd5 / teal #0f766e / tealHover #115e59 / tealLight #f0fdfa / stoneDark #1c1917 / stoneLight #fafaf9 / stoneBorder #e7e5e4` + `Inter`/`Poppins` type scale, `rounded-2xl`, `border-gray-200`, `shadow-sm`.
- Polish: `ScreenHeader` respect safe area, `EmptyState` 📭 with subtitle `Bạn chưa có việc...` per demo table, `LoadingSpinner` + `SkeletonCard` shimmer `Animated.opacity 0.3->1`, `KeyboardAvoidingView` on forms, `SafeAreaView` + bottom padding.
- Replace leftover ad-hoc colors/radii across screens with tokens; audit every list screen for an empty state branch.

**Files to touch:**
- `app_mobile/lib/core/theme/{theme.ts, tokens.ts}`, `app_mobile/tailwind.config.js`, `app_mobile/lib/components/{EmptyState.tsx, LoadingSpinner.tsx, ScreenHeader.tsx}`, all feature screens add `EmptyState` branches.

**Steps:**
1. Define tokens in `theme.ts` and NativeWind config; apply to root layout.
2. Create `EmptyState`/`LoadingSpinner` and swap in per screen.
3. Audit each list screen for the empty branch per spec §7.2 (`seeker/jobs` "Bạn chưa có việc...", `tasker/board` "Hiện chưa có việc mới...", etc.).
4. Ensure `formatVnd` uses `Intl.NumberFormat('vi-VN')`.
5. Add accessibility labels to icon-only buttons (bell, avatar, role toggle).

**Acceptance:**
- Every screen matches demo `rounded-2xl`/`orange vs teal` theming; empty states show correct vi copy; no raw hex outside `theme.ts`.
- `npx tsc --noEmit` zero errors; app boots with `EXPO_PUBLIC_USE_MOCK=1` and shows polish.

**Verification:**
```bash
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `chore(polish): vi tokens + empty states (#09)`

**Notes:** Strings were never extracted to keys; keep them inline vi. Do not add an i18n dependency.
