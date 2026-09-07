# 09 — i18n (vi default) + Design Tokens + Polish

**Goal:** PRM393 `vi` gate + Figma fidelity polish before tests/deploy.

**Depends:** 01-08. **Branch:** `feat/09-i18n` off `master`.

**API contract:** None (frontend). Locale `vi` fallback, `en` secondary.

**Flutter:**
- `easy_localization` already scaffolded in 00; now populate `app_mobile/assets/translations/vi.json` + `en.json` full keys: `auth.*`, `jobs.*`, `board.*`, `chat.*`, `wallet.*`, `rating.*`, `profile.*`, `common.*` (copy demo Vietnamese strings `Đăng việc & Tìm Tasker ngay`, `Đang tìm Tasker phù hợp`, `Ký quỹ an toàn`, etc. from demo `CATEGORY_META`/`AVAILABILITY_LABEL`/`VEHICLE_LABEL`).
- `MaterialApp(localizationsDelegates: context.localizationDelegates, supportedLocales: [Locale('vi'), Locale('en')], locale: Locale('vi'), fallbackLocale: Locale('vi'))`.
- Tokens: `ThemeData` `AppColors` `orange #ea580c / orangeHover #c2410c / orangeLight #ffedd5 / teal #0f766e / tealHover #115e59 / tealLight #f0fdfa / stoneDark #1c1917 / stoneLight #fafaf9 / stoneBorder #e7e5e4` + `Inter`/`Poppins` `TextTheme`, `rounded-2xl`, `border-gray-200`, `shadow-sm`, `FontAwesome` via `font_awesome_flutter` parity.
- Polish: `ScreenHeader` pt-safe, `EmptyState` 📭 with subtitle `Bạn chưa có việc...` per demo table, `LoadingSpinner` + `SkeletonCard` shimmer `Animated.opacity 0.3->1`, `KeyboardAvoidingView` on forms, `SafeArea` + `pb-safe`.

**Files to touch:**
- `app_mobile/assets/translations/vi.json`, `en.json`, `app_mobile/lib/l10n/*` generated, `app_mobile/lib/core/theme/app_colors.dart`, `app_mobile/lib/core/theme/app_text.dart`, `app_mobile/lib/shared/widgets/empty_state.dart`, `app_mobile/lib/shared/widgets/loading_spinner.dart`, all pages add `EmptyState` branches.

**Steps:**
1. Extract all hardcoded strings from 8 screens into `vi.json` 120+ keys, add `en.json` translations.
2. Wrap `Text()` with `tr()` or `context.tr()`, add `EasyLocalization` `assetLoader`.
3. Create `AppColors` + `AppTheme` + apply `ThemeData(useMaterial3:true, colorScheme: ...)`.
4. Audit every list screen for empty state per spec `§7.2` (`seeker/jobs` "Bạn chưa có việc...", `tasker/board` "Hiện chưa có việc mới...", etc.).
5. Ensure `formatVnd` uses `NumberFormat('vi_VN')` + `easy_localization` date.

**Acceptance:**
- Switch device to `en` or `--dart-define=LOCALE=en` -> UI switches, default `vi` without param.
- Every screen matches demo `rounded-2xl`/`orange vs teal` theming, empty states show correct vi copy, `flutter analyze` zero issues.

**Verification:**
```bash
flutter gen-l10n  # if using flutter_localizations
flutter analyze
flutter test  # ensure tr keys don't break widget tests
```

**Commit:** `feat(i18n): vi default + tokens + empty states (#09)`

**Notes:** PRM393 lecturer checks `assets/translations/vi.json` existence, not 100% coverage — prioritize auth+jobs+chat.
