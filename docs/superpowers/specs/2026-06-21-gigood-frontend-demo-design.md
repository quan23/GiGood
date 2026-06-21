# GiGood — Frontend Expo Demo: Design Spec

**Date:** 2026-06-21
**Status:** Approved (Sections 1–5), pending user spec review
**Scope:** Frontend-only Expo demo (no backend), 1:1 rebuild of `assets/index.html` in Expo SDK 54

---

## 1. Context and Goals

`GiGood` is a mobile-first, two-sided job marketplace (Seeker = hirer, Tasker = worker) with a Vietnamese-language UI. The existing `assets/index.html` is a fully-styled Tailwind demo that captures the entire UX/UI. This design spec turns it into a working **Expo + React Native + TypeScript** application that:

- Matches the HTML's structure, look, and interactions 1:1
- Uses the tech stack named in `README.md` (Expo Router, NativeWind, Expo SecureStore), with one pragmatic deviation: **React Context + useReducer** replaces Zustand/TanStack-Query because there is no backend
- Targets **Expo SDK 54** (downgrade from the currently-installed SDK 56)
- Runs entirely client-side, **session-only** (no persistence between launches)

The backend, real maps, push notifications, and i18n are explicitly out of scope.

---

## 2. Tech Stack & Compatibility

| Item | Value | Notes |
| --- | --- | --- |
| Expo SDK | 54 (downgrade from 56) | Per user direction; AGENTS.md references v54 docs |
| React Native | 0.81.x (downgrade from 0.86) | Required by SDK 54 |
| React | 19.1.0 | Already installed; SDK 54-compatible |
| expo-router | ~6.0.x (downgrade from 56.x) | File-based routing |
| TypeScript | ~5.9.2 (strict mode) | tsconfig already on `strict: true` |
| NativeWind | 4.2.5 | **Currently unconfigured** — needs `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` |
| Tailwind CSS | 3.4.19 | Tokens match HTML's `brand` palette |
| Expo SecureStore | 14.0.x (downgrade from 15) | Installed but unused (session-only) |
| `@expo/vector-icons` | 15.x | `FontAwesome` covers the HTML's icons |
| `react-native-reanimated` | 4.x | Drives radar ping + modal slide-up |
| `react-native-safe-area-context` | 5.x | SafeArea on every screen |
| `react-native-screens` | 4.x | Native screen primitives for the stack/tabs |
| State | **React Context + useReducer** (no extra deps) | Replaces Zustand from README; no backend means no TanStack Query |

**Not installed and not needed** (deferred until a backend exists): `axios`, `@tanstack/react-query`, `zustand`, `react-native-svg`, `react-native-maps`.

**Setup tasks** (separate from feature work):
- Downgrade `expo`, `react-native`, `expo-router`, `expo-secure-store`, and other Expo packages to their SDK 54 versions (`npx expo install --fix`)
- Create `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` for NativeWind
- Remove the unused `(tabs)/_layout.tsx` and the default `explore.tsx` / `index.tsx` placeholder

---

## 3. Architecture

### 3.1 Route layout (Expo Router)

```
app/
  _layout.tsx                       # Root: providers (GiGoodContext, fonts), mounts <Toast />
  index.tsx                         # Redirects to /(auth)/welcome or /(app) based on auth state
  +not-found.tsx
  (auth)/
    _layout.tsx                     # Redirects to /(app) if already signed in
    welcome.tsx                     # Splash/welcome (gradient + bullets)
    login.tsx                       # Phone + password + quick-login sample accounts
    role-select.tsx                 # Seeker vs Tasker
    signup-basic.tsx                # Name, phone, password, location, terms
    signup-tasker-profile.tsx       # Skills, bio, availability, vehicle, CCCD placeholder
  (app)/
    _layout.tsx                     # Sticky header + role-aware bottom tabs; switches sub-tabs in-place
    index.tsx                       # Default sub-tab (seeker: post, tasker: board)
    profile.tsx                     # Stacked on top of the main app
    modal-rating.tsx                # presented as transparentModal (seeker side, orange)
    modal-rating-tasker.tsx         # presented as transparentModal (tasker side, teal)
    seeker/
      post.tsx
      jobs.tsx
      history.tsx
      chat/
        index.tsx
        [jobId].tsx
    tasker/
      board.tsx
      active.tsx
      earnings.tsx
      chat/
        index.tsx
        [jobId].tsx
```

**Routing rationale.** Group by app state: `(auth)/` for unauth screens, `(app)/` for the role-aware main experience. The seeker and tasker sub-tabs live as siblings under `(app)/seeker/` and `(app)/tasker/`; the `(app)/_layout.tsx` chooses which subtree to mount based on `currentRole`. Profile and modals are stacked above the active sub-tab.

### 3.2 State shape

```ts
type GiGoodState = {
  auth: {
    profile: UserProfile | null      // null = not signed in
    currentRole: 'seeker' | 'tasker'
    pendingSignupRole: 'seeker' | 'tasker'  // set by role-select, consumed by signup-basic
  }
  ui: {
    activeSeekerSubTab: 'post' | 'jobs' | 'chat' | 'history'
    activeTaskerSubTab: 'board' | 'active' | 'chat' | 'earnings'
    activeChatId: number | null
    chatDetailOpen: boolean
    notifOpen: boolean
    notifBadge: boolean
    matchingJobIdRef: number | null   // drives the seeker/jobs radar panel
    toast: { message: string; variant: 'success' | 'error' | 'info'; visible: boolean } | null
  }
  data: {
    jobs: Job[]                       // 2 seed jobs on launch (matches HTML)
    notifications: Notification[]
    seekerWallet: number              // 1,420,000 VND
    taskerWallet: number              // 2,850,000 VND
    escrowHeldPool: number            // 150,000 VND
  }
}

type UserProfile = {
  name: string
  avatar: string
  role: 'seeker' | 'tasker'
  phone: string
  location: string
  taskerProfile: TaskerProfile | null
}

type TaskerProfile = {
  skills: Array<'repair' | 'cleaning' | 'delivery' | 'helper'>
  bio: string
  availability: 'all-day' | 'morning' | 'afternoon' | 'evening' | 'weekend'
  vehicle: 'motorbike' | 'car' | 'bike' | 'none'
  verified: boolean
}

type Job = {
  id: number
  title: string
  category: 'repair' | 'cleaning' | 'delivery' | 'helper'
  budget: number                     // VND
  location: string
  description: string
  status: 'finding' | 'assigned' | 'completed'
  seekerName: string
  taskerName: string | null
  timeTag: string
  chats: ChatMessage[]
  seekerRating: number | null
  taskerRating: number | null
  isCompletedReportedByTasker: boolean
  mapX: string                        // CSS percent string for the static map marker
  mapY: string
}

type ChatMessage = { sender: 'seeker' | 'tasker'; text: string; time: string }
type Notification = { id: number; text: string; time: string; read: boolean }
```

### 3.3 Data flow

A single `useReducer` in `GiGoodContext.Provider` produces new top-level state on every action. Custom hooks (`useAuth`, `useJobs`, `useChat`, `useNotifications`, `useWallet`, `useToast`) return derived slices; React re-renders only the components that subscribed to the changed slice. The HTML's `refreshAllDashboards()` call is replaced by reducer-driven re-renders.

### 3.4 Persistence

**Session-only.** No `AsyncStorage` or `SecureStore` wiring. The 2 sample jobs, wallets, and escrow pool are seeded from constants in `lib/seed.ts` on every launch. Logging out clears `auth` and `ui` but preserves `data` so the demo can be replayed without losing sample data.

---

## 4. Reusable Component Library (`components/ui/`)

Twelve small components + 2 helper modules. Each is screen-agnostic and lives in `components/ui/`. The default export style matches the existing `components/themed-text.tsx` pattern.

### 4.1 Primitives

| Component | Purpose | Replaces HTML pattern |
| --- | --- | --- |
| `Button` | Primary action button. Variants: `orange` / `teal` / `stone` / `ghost`. Optional leading icon. Press-scale animation via Reanimated. | `<button class="bg-brand-orange text-white ...">` everywhere |
| `FormField` | Label + `TextInput` + optional left icon + helper text. Variants: `default` / `select` (with chevron). Red border on submit-attempted empty. | Each `<div class="space-y-1.5"><label>…<input>…</div>` |
| `ScreenHeader` | Safe-area top bar: back chevron + title + optional right slot. | Every screen except welcome and main-app |
| `AvatarPill` | Circular avatar via `expo-image`. Sizes: `sm` (28px) / `md` (36px) / `lg` (44px) / `xl` (64px). Initials fallback on error. | Inline `<img class="rounded-full …">` everywhere |

### 4.2 Domain components

| Component | Purpose | Replaces HTML pattern |
| --- | --- | --- |
| `JobCard` | Job summary. Variants: `seeker-active` / `tasker-available` / `tasker-assigned`. Renders category icon, title, time, description, location, budget, status badge, action button. | The 3 different `*active-jobs*` / `*available-jobs*` / `*assigned-jobs*` render functions in the HTML |
| `ChatBubble` | Message bubble aligned left/right. Props: `side`, `text`, `time`, `showAvatar`. | The inline `if (isMe) … else …` blocks in chat render fns |
| `StarRow` | Interactive 1–5 star rating. `value` + `onChange`. | `renderStarRow` + duplicated state in the HTML |
| `ModalSheet` | Bottom-sheet modal with drag handle, content slot, optional title row. Wraps RN's `Modal` with `transparent` + `animationType="slide"`. | `#completion-modal` and `#tasker-rating-modal` |
| `Toast` | Floating toast at bottom of screen. Auto-dismiss via internal `useEffect` timer (3.5s). Variants: `success` / `error` / `info`. | `#toast-box` |

### 4.3 Atoms

| Component | Purpose | Replaces HTML pattern |
| --- | --- | --- |
| `IconPill` | Small icon-in-circle + label (e.g., "Ký quỹ an toàn · 150,000 VND"). | Header wallet/escrow cards, info banners |
| `SegmentedToggle` | 2-option segmented control. Used for the role switcher. | `#toggle-seeker` / `#toggle-tasker` |
| `StatusBadge` | Colored pill for job status. Variants: `finding` / `assigned` / `reported` / `completed`. | Status badges in `JobCard` and history list |

### 4.4 Helpers (`lib/`)

- `categories.ts` — `CATEGORY_META` (icon, label, accent color), `AVAILABILITY_LABEL`, `VEHICLE_LABEL`
- `format.ts` — `formatVND(num)`, `formatRelativeTime()`

### 4.5 What we are not decomposing

The **mini-map** in the tasker board uses absolute-positioned `View` children over a `View` with grid-line `View` stripes; the "ping" markers are Reanimated views. It stays inline in `tasker/board.tsx` — a single-use decorative element doesn't justify its own file.

---

## 5. Screen Inventory

19 screen/modal files in `app/` (1 root redirect + 1 not-found + 5 auth + 1 dispatcher + 1 profile + 2 modals + 4 seeker + 4 tasker), each thin (most delegate to Section 4 components). 1 toast component, mounted once at the root.

### 5.1 Auth group (`app/(auth)/`)

| # | File | Behavior |
| --- | --- | --- |
| 1 | `welcome.tsx` | Orange gradient hero. Renders bullets inline. `Button` → `role-select`; ghost link → `login`. |
| 2 | `login.tsx` | `FormField` × 2 (phone, password). Below: 2 `Button` (ghost) for quick-login sample accounts (Khánh Vy = seeker, Minh Quân = tasker). Footer link to `role-select`. |
| 3 | `role-select.tsx` | 2 large selectable cards. Dispatches `setPendingRole` to context, then `router.push('signup-basic')`. |
| 4 | `signup-basic.tsx` | Progress dots (1/2). `FormField` × 4. Terms checkbox. Submit dispatches `signUp()` → either `router.replace('/(app)')` (seeker) or `router.push('signup-tasker-profile')` (tasker). |
| 5 | `signup-tasker-profile.tsx` | Progress dots (2/2). Skill grid (4 buttons, multi-select). Bio `Textarea`. `FormField` (select) for availability + vehicle. CCCD placeholder banner. Submit dispatches `signUpTasker()` → `router.replace('/(app)')`. |

### 5.2 App group (`app/(app)/`)

| # | File | Behavior |
| --- | --- | --- |
| 6 | `_layout.tsx` | Sticky header (logo, role badge, notif bell, avatar, role `SegmentedToggle`, wallet + escrow `IconPill`s). Role-aware bottom `Tabs` (4 per role). |
| 7 | `seeker/post.tsx` | 4 quick-template cards that prefill the form. Form: title, category select, description, budget + urgency (row), location. Submit dispatches `postJob()` and starts a 4s matching simulation, then switches to `seeker/jobs`. |
| 8 | `seeker/jobs.tsx` | Radar panel when a job is `finding`; matched card when a job is `assigned` via simulation; `JobCard` list. Tapping an `assigned` card → `router.push('chat/[jobId]')`. |
| 9 | `seeker/chat/index.tsx` | List of `assigned`/`completed` jobs. Tapping → `router.push('chat/[jobId]')`. |
| 10 | `seeker/chat/[jobId].tsx` | Header (avatar + name + job tag). Thread of `ChatBubble`s. Composer (input + send). Send dispatches `sendChat()`. |
| 11 | `seeker/history.tsx` | `JobCard` list of `completed` jobs. |
| 12 | `tasker/board.tsx` | Inline mini-map + `JobCard` list of `finding` jobs (with "Nhận việc này" button). |
| 13 | `tasker/active.tsx` | `JobCard` list of `assigned` jobs (with "Báo đã hoàn thành" button → opens `modal-rating-tasker`). |
| 14 | `tasker/chat/index.tsx`, `tasker/chat/[jobId].tsx` | Same as seeker chat. |
| 15 | `tasker/earnings.tsx` | 2 stat cards (total earnings, completed count) + `JobCard` list. |

### 5.3 Profile & modals

| # | File | Behavior |
| --- | --- | --- |
| 16 | `profile.tsx` | Stacked in `(app)`. Avatar + name + role tag + member tier. If tasker: skill tags, bio, availability, vehicle, CCCD status. Phone, location. Logout → `signOut()` → `router.replace('/(auth)/welcome')`. |
| 17 | `modal-rating.tsx` | `presentation: 'transparentModal'` (seeker side, orange-accented). `ModalSheet` with amount + `StarRow` + comment. Submit dispatches `releaseEscrow()` + closes modal. |
| 18 | `modal-rating-tasker.tsx` | `presentation: 'transparentModal'` (tasker side, teal-accented). `ModalSheet` with `StarRow` + comment. Submit dispatches `rateSeeker()` + closes modal. |

### 5.4 Global

- `Toast` — mounted once in `app/_layout.tsx`. Subscribes to `state.ui.toast`; auto-hides after 3.5s via internal `useEffect`.

---

## 6. Data Flow & Reducer Actions

A single `useReducer` in `GiGoodContext`. All updates are immutable.

| Action | Effect |
| --- | --- |
| `signIn(profile)` | `auth.profile = profile`, `auth.currentRole = profile.role`, push welcome notif, show toast |
| `signUp(payload)` | Build `UserProfile`, persist to `auth.profile`, route to dashboard or tasker-profile step |
| `signOut()` | Clear `auth.profile` + reset `ui` (preserves `data.jobs` for replay) |
| `switchRole(role)` | If `role !== auth.currentRole`, swap; seed second profile if missing so a seeker can demo tasker view without re-signing-up |
| `setPendingRole(role)` | `ui.pendingSignupRole = role` (used by role-select → signup-basic) |
| `postJob(payload)` | Prepend new `Job` with `status: 'finding'`, `timeTag: 'Vừa đăng'`, `mapX/mapY: random` |
| `startMatching(jobId)` | Set `ui.matchingJobIdRef = jobId`, schedule `completeMatching` in 4s |
| `completeMatching(jobId)` | Pick random sample tasker, `status = 'assigned'`, push system chat, debit `seekerWallet` → credit `escrowHeldPool`, switch to seeker/jobs sub-tab, show toast |
| `acceptJob(jobId)` | Mirror of `completeMatching` from tasker side; pushes welcome chat, no wallet move yet |
| `reportComplete(jobId)` | `job.isCompletedReportedByTasker = true`, open tasker-rating modal |
| `releaseEscrow(jobId, rating, comment)` | `status = 'completed'`, `seekerRating = rating`, debit `escrowHeldPool` → credit `taskerWallet` |
| `rateSeeker(jobId, rating, comment)` | `taskerRating = rating` |
| `sendChat(jobId, sender, text)` | Append to `job.chats`; after 1s timeout, if recipient is on different role, dot their notif + push notif |
| `openChat(jobId)` | `ui.activeChatId = jobId`, `ui.chatDetailOpen = true` |
| `closeChat()` | `ui.chatDetailOpen = false` |
| `setSeekerSubTab(tab)` / `setTaskerSubTab(tab)` | Persist current sub-tab in `ui` so it survives role flips |
| `pushNotif(text)` | Prepend to `data.notifications`, set `ui.notifBadge = true` |
| `clearNotifs()` | Empty `data.notifications`, `ui.notifBadge = false` |
| `showToast(message, variant)` | Set `ui.toast = { message, variant, visible: true }` |
| `dismissToast()` | `ui.toast.visible = false` |

### 6.1 Side effects (lived in screens, not the reducer)

- **Matching simulation timer** — `seeker/jobs.tsx` `useEffect` keyed on `ui.matchingJobIdRef`. When timer fires, dispatches `completeMatching`.
- **Chat cross-role ping** — `chat/[jobId].tsx` `useEffect` watching `job.chats.length`; schedules a `setTimeout` to dispatch `pushNotif` + show toast on the other role.
- **Toast auto-hide** — `Toast` component's internal `useEffect`.

### 6.2 Custom hooks (`hooks/`)

- `useAuth()` → `{ profile, currentRole, signIn, signUp, signOut, switchRole, pendingRole, setPendingRole }`
- `useJobs()` → `{ jobs, postJob, acceptJob, reportComplete, releaseEscrow, rateSeeker }` + memoized derived lists (`activeJobs`, `availableJobs`, `assignedJobs`, `completedJobs`)
- `useChat()` → `{ activeChatId, openChat, closeChat, sendChat, currentThread }`
- `useNotifications()` → `{ notifications, pushNotif, clearNotifs, hasUnread }`
- `useWallet()` → `{ seekerWallet, taskerWallet, escrowHeldPool, role: 'seeker' | 'tasker' }`
- `useToast()` → `{ toast, showToast, dismissToast }`

---

## 7. Error Handling, Edge Cases, and Quality

### 7.1 Validation

- `FormField` shows a thin red border on submit-attempted-empty for `required` fields.
- Skill-tag submit: if 0 selected, dispatch `showToast(..., 'error')` and abort.
- Budget must parse as a positive int.
- Phone format is not strictly validated (matches HTML: mock login accepts any number).

### 7.2 Empty states (one per list-bearing screen, identical to HTML)

| Screen | Empty message |
| --- | --- |
| `seeker/jobs` | "Bạn chưa có việc nào đang xử lý. Hãy đăng việc mới!" |
| `seeker/history` | "Chưa có giao dịch nào hoàn tất." |
| `seeker/chat` & `tasker/chat` | "Chưa có cuộc trò chuyện nào…" |
| `tasker/board` | "Hiện chưa có việc mới gần bạn. Hãy quay lại sau!" |
| `tasker/active` | "Bạn chưa nhận việc nào. Vào 'Bảng việc' để xem các việc gần bạn!" |
| `tasker/earnings` | "Chưa có lịch sử nhận tiền nào." |

### 7.3 Avatar failures

`AvatarPill` uses `expo-image` with a solid-color fallback (initials) on `onError`. No network dependency for the demo.

### 7.4 Safe areas & keyboard

`SafeAreaView` from `react-native-safe-area-context` on every screen. `KeyboardAvoidingView` wraps the two signup forms. Bottom tabs respect `pb-safe`.

### 7.5 Theming & animations

- `tailwind.config.js` declares `brand.orange` (`#ea580c`), `brand.teal` (`#0f766e`), `brand.stone*` matching the HTML's Tailwind extend block.
- Custom keyframes for the `ping` (radar pulse) and `slide-up` (modal entry) animations are added; implemented in RN with `Animated` / `Reanimated` (radar pulse uses a `Reanimated` shared value to scale + fade the marker).

### 7.6 Quality gates (run before claiming done)

1. `npx expo install --check` — confirm SDK 54 pin
2. `npx tsc --noEmit` — typecheck passes
3. `npx expo lint` — lint passes
4. Manual smoke: launch on Expo Go, walk the 5 auth screens → switch role → post job → accept (switch role) → chat both ways → report complete → release + rate → check history + earnings

### 7.7 Explicitly out of scope

- Real backend / API calls (axios + react-query deferred)
- i18n — Vietnamese only; strings inline as literals; future i18n can extract them to `lib/strings.ts`
- Push notifications via `expo-notifications` (the notif center is in-app only)
- Real maps (the static decorative map stays; no `react-native-maps`)
- Haptics (not in HTML)
- Unit tests (manual smoke covers this scope; add if logic grows)

---

## 8. Risks & Open Questions

| Risk | Mitigation |
| --- | --- |
| SDK 56 → 54 downgrade touches many packages | Use `npx expo install --fix`; the existing React 19.1.0 and react-native-web 0.21.0 are already compatible |
| NativeWind v4 has no working config yet | `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` are part of setup; verify `className` works on a smoke component before building screens |
| Native tabs (`expo-router` built-in) are nice but role-aware tabs need conditional mounting | The `(app)/_layout.tsx` chooses which subtree to mount; both `seeker/` and `tasker/` tabs are real routes so deep links still work |
| Vietnamese strings are scattered across 18 files | Acceptable for the demo. Future i18n can refactor; not blocking |

---

## 9. Implementation Order (high-level)

1. **Setup**: downgrade to SDK 54, configure NativeWind, remove template boilerplate.
2. **Foundation**: types, seed data, context, reducer, custom hooks, helpers.
3. **Components**: build the 12 components in Section 4.
4. **Auth screens**: welcome → login → role-select → signup-basic → signup-tasker-profile.
5. **App shell**: `(app)/_layout.tsx` with header, role switcher, bottom tabs.
6. **Seeker screens**: post, jobs, chat (list + detail), history.
7. **Tasker screens**: board, active, chat, earnings.
8. **Profile + modals**: profile, seeker rating modal, tasker rating modal.
9. **Polish**: empty states, animations, validation, lint/typecheck smoke.

Each step is independently verifiable on Expo Go.
