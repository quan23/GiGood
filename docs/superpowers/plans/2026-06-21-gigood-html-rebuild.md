# GiGood HTML Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current Expo project to match `assets/index.html` (2203-line HTML/CSS/JS design) 1:1 — same screens, same interactions, same state logic, same visual design.

**Architecture:** Modify existing files rather than creating new ones where possible. Keep Context + useReducer, Expo Router, NativeWind, Reanimated. Change: categories from 8→4, add welcome/login screens, add header with role switcher + wallet/escrow, add matching radar + mini map + chat inline detail + completion modals + toast.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19.1, Expo Router, NativeWind v4, Reanimated 4.1.1, Context + useReducer. `@expo/vector-icons` (FontAwesome) replaces emoji unicode.

**Source of truth file:** `assets/index.html` — all UI copy, colors, layouts, and logic are extracted from this file.

---

## Scope Check

The plan covers ALL 15 areas identified in the gap analysis. No independent subsystems to split.

## File Structure

### Files to MODIFY (existing):
| File | Change |
|------|--------|
| `types/index.ts` | 4 categories (`repair`, `cleaning`, `delivery`, `helper`), update state shape |
| `lib/categories.ts` | Match HTML's CATEGORY_META + AVAILABILITY_LABEL + VEHICLE_LABEL |
| `lib/format.ts` | Add formatRelativeTime |
| `lib/seed.ts` | Match HTML's initial state (2 jobs, wallets, sample taskers) |
| `lib/GiGoodContext.tsx` | Rewrite reducer with all HTML actions |
| `hooks/useJobs.ts` | Update for new state shape |
| `hooks/useNotifications.ts` | Update pushNotif signature |
| `hooks/useUi.ts` | Update for new tab names + notif tray |
| `hooks/useSeeker.ts` | Update category filters |
| `hooks/useTasker.ts` | Update category filters |
| `app/_layout.tsx` | Keep GiGoodProvider + Toast + StatusBar |
| `app/(app)/_layout.tsx` | Add sticky header (brand, role badge, notif bell, role switcher, wallet/escrow) |
| `app/(app)/(tabs)/_layout.tsx` | Full rewrite: FontAwesome icons, orange/teal colors, 4 tabs per role |
| `app/(app)/(tabs)/board.tsx` | Add mini map (absolute-positioned View), update card style |
| `app/(app)/(tabs)/active.tsx` | Rewrite card layout to match HTML |
| `app/(app)/(tabs)/history.tsx` | Rewrite to match HTML history list |
| `app/(app)/(tabs)/jobs.tsx` | Add matching radar + matched tasker view |
| `app/(app)/(tabs)/chat.tsx` | Add combined sidebar + detail view |
| `app/(app)/(tabs)/post.tsx` | Add quick template grid, update form layout |
| `app/(app)/(tabs)/earnings.tsx` | Update stat cards style |
| `app/(app)/profile.tsx` | Rewrite to match HTML profile layout |
| `app/(app)/chat/[id].tsx` | Keep but update styling |
| `app/(app)/notifications.tsx` | Keep as modal, update styling |

### Files to CREATE:
| File | Purpose |
|------|---------|
| `app/(auth)/welcome.tsx` | Splash/welcome (orange gradient + feature bullets) |
| `app/(auth)/login.tsx` | Phone + password form + quick-login sample accounts |
| `app/(auth)/role-select.tsx` | 2 large role cards (Seeker/Tasker) |
| `app/(auth)/signup-basic.tsx` | 2-step signup step 1: name, phone, password, location, terms |
| `app/(auth)/signup-tasker-profile.tsx` | 2-step signup step 2: skills grid, bio, availability, vehicle, CCCD |
| `components/ui/StarRow.tsx` | Interactive 1-5 star rating |
| `components/ui/ModalSheet.tsx` | Bottom sheet modal with drag handle |
| `components/ui/ScreenHeader.tsx` | Safe-area header with back + title |
| `components/ui/AvatarPill.tsx` | Circular avatar with initials fallback |
| `components/ui/IconPill.tsx` | Small icon + label card |
| `components/ui/SegmentedToggle.tsx` | 2-option segmented control |
| `components/ui/StatusBadge.tsx` | Colored status pill |
| `components/ui/FormField.tsx` | Label + TextInput + icon + helper text |
| `hooks/useAuth.ts` | Auth-specific hook |
| `hooks/useChat.ts` | Chat-specific hook |
| `hooks/useWallet.ts` | Wallet + escrow hook |

### Files to DELETE:
| File | Reason |
|------|--------|
| `app/(auth)/signup-seeker.tsx` | Replaced by signup-basic.tsx |
| `app/(auth)/signup-tasker.tsx` | Replaced by signup-basic.tsx + signup-tasker-profile.tsx |

---

## Phase A: Data Layer Rewrite

### Task 1: Rewrite types

**Files:** Modify `types/index.ts`, `lib/categories.ts`, `lib/format.ts`

- [ ] **Step 1: Replace `types/index.ts`**

```typescript
export type Role = 'seeker' | 'tasker'
export type Category = 'repair' | 'cleaning' | 'delivery' | 'helper'
export type Availability = 'all-day' | 'morning' | 'afternoon' | 'evening' | 'weekend'
export type Vehicle = 'motorbike' | 'car' | 'bike' | 'none'
export type JobStatus = 'finding' | 'assigned' | 'completed'
export type ToastVariant = 'success' | 'error' | 'info'
export type SeekerSubTab = 'post' | 'jobs' | 'chat' | 'history'
export type TaskerSubTab = 'board' | 'active' | 'chat' | 'earnings'

export type TaskerProfile = {
  skills: Category[]; bio: string; availability: Availability; vehicle: Vehicle; verified: boolean
}

export type UserProfile = {
  name: string; avatar: string; role: Role; phone: string; location: string; taskerProfile: TaskerProfile | null
}

export type ChatMessage = { sender: Role; text: string; time: string }
export type Job = {
  id: number; title: string; category: Category; budget: number; location: string;
  description: string; status: JobStatus; seekerName: string; taskerName: string | null;
  timeTag: string; chats: ChatMessage[]; seekerRating: number | null; taskerRating: number | null;
  isCompletedReportedByTasker: boolean; mapX: string; mapY: string
}
export type Notification = { id: number; text: string; time: string; read: boolean }
export type ToastState = { message: string; variant: ToastVariant; visible: boolean } | null

export type GiGoodState = {
  auth: { profile: UserProfile | null; currentRole: Role; pendingSignupRole: Role }
  ui: {
    activeSeekerSubTab: SeekerSubTab; activeTaskerSubTab: TaskerSubTab;
    activeChatId: number | null; chatDetailOpen: boolean; notifOpen: boolean;
    notifBadge: boolean; matchingJobIdRef: number | null; toast: ToastState
  }
  data: { jobs: Job[]; notifications: Notification[]; seekerWallet: number; taskerWallet: number; escrowHeldPool: number }
}
```

- [ ] **Step 2: Rewrite `lib/categories.ts`**

```typescript
import { Category, Availability, Vehicle } from '../types'

export const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  repair: { label: 'Sửa chữa vặt', icon: 'screwdriver-wrench' },
  cleaning: { label: 'Dọn dẹp nhà cửa', icon: 'broom' },
  delivery: { label: 'Vận chuyển/Giao hàng', icon: 'motorcycle' },
  helper: { label: 'Hỗ trợ/Nhờ việc vặt', icon: 'hands-holding' },
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'all-day': 'Cả ngày, linh hoạt', morning: 'Buổi sáng (6h-12h)',
  afternoon: 'Buổi chiều (12h-18h)', evening: 'Buổi tối (18h-22h)', weekend: 'Chỉ cuối tuần',
}

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  motorbike: 'Xe máy', car: 'Ô tô', bike: 'Xe đạp', none: 'Đi bộ / không có xe',
}
```

- [ ] **Step 3: Replace `lib/format.ts`**

```typescript
export function formatVnd(num: number): string {
  return num.toLocaleString('vi-VN') + ' VND'
}
```

### Task 2: Rewrite seed data

**Files:** Modify `lib/seed.ts`

- [ ] **Step 1: Replace with HTML's exact initial state**

```typescript
import { GiGoodState, Job } from '../types'
import { CATEGORY_META } from './categories'

export const SAMPLE_TASKERS = [
  { name: 'Minh Quân T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
  { name: 'Anh Hào D.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Thành Long P.', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=150' },
]

const INITIAL_JOBS: Job[] = [
  {
    id: 201,
    title: 'Khơi thông thoát sàn toilet tràn nước', category: 'repair', budget: 150000,
    location: '120 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    description: 'Đường thoát nước phòng tắm bị tắc rác bẩn gây tràn. Cần thợ đem theo dây thông tắc lò xo dài tối thiểu 3m xử lý triệt để.',
    status: 'assigned', seekerName: 'Khánh Vy', taskerName: 'Minh Quân T.', timeTag: '25 phút trước',
    chats: [
      { sender: 'tasker', text: 'Chào chị Vy, em vừa nhận đơn thông thoát sàn của mình. Em chuẩn bị đồ đạc rồi chạy qua liền đây chị nha.', time: '10:42' },
      { sender: 'seeker', text: 'Chào em, nhớ mang theo máy thông tắc lò xo loại lớn nhé. Đường cống nhà chị dài lắm.', time: '10:44' },
      { sender: 'tasker', text: 'Dạ vâng ạ, máy lò xo em bỏ sẵn sau xe rồi, tầm 10 phút nữa em có mặt chị ạ.', time: '10:45' },
    ],
    seekerRating: null, taskerRating: null, isCompletedReportedByTasker: false, mapX: '20%', mapY: '45%',
  },
  {
    id: 202, title: 'Giao gấp hộp bánh ngọt cho khách hàng', category: 'delivery', budget: 45000,
    location: '88 Pasteur, Quận 1 đến Quận 3',
    description: 'Cần một bạn shipper chạy cẩn thận bọc màng khí tránh va đập hư hỏng trang trí mặt bánh.',
    status: 'finding', seekerName: 'Khánh Vy', taskerName: null, timeTag: '2 giờ trước',
    chats: [], seekerRating: null, taskerRating: null, isCompletedReportedByTasker: false, mapX: '70%', mapY: '35%',
  },
]

export function createInitialState(): GiGoodState {
  return {
    auth: { profile: null, currentRole: 'seeker', pendingSignupRole: 'seeker' },
    ui: {
      activeSeekerSubTab: 'post', activeTaskerSubTab: 'board', activeChatId: null,
      chatDetailOpen: false, notifOpen: false, notifBadge: false, matchingJobIdRef: null, toast: null,
    },
    data: { jobs: INITIAL_JOBS, notifications: [], seekerWallet: 1420000, taskerWallet: 2850000, escrowHeldPool: 150000 },
  }
}
```

---

## Phase B: State Management Rewrite

### Task 3: Rewrite GiGoodContext (reducer + provider + hooks)

**Files:** Modify `lib/GiGoodContext.tsx`

- [ ] **Step 1: Write the complete file with action types, reducer, provider, and context hook**

Key actions: REGISTER_ROLE, FINISH_SIGNUP_SEEKER, FINISH_SIGNUP_TASKER, QUICK_LOGIN, SIGN_OUT, SWITCH_ROLE, SET_SEEKER_SUB_TAB, SET_TASKER_SUB_TAB, POST_JOB, START_MATCHING, COMPLETE_MATCHING, ACCEPT_JOB, REPORT_COMPLETED, RELEASE_ESCROW, RATE_TASKER, SEND_CHAT, SET_ACTIVE_CHAT, SET_CHAT_DETAIL, PUSH_NOTIF, CLEAR_NOTIFS, SET_NOTIF_BADGE, SHOW_TOAST, HIDE_TOAST.

The reducer matches HTML's `window.GiGoodState` logic exactly: quick login fills Khánh Vy (seeker) or Minh Quân (tasker) profiles, matching picks random SAMPLE_TASKERS, release escrow moves money escrow→tasker wallet.

- [ ] Step 1a: Delete the old file content completely  
- [ ] Step 1b: Write action type union (24 action types)  
- [ ] Step 1c: Write reducer with all cases matching HTML behavior  
- [ ] Step 1d: Write GiGoodContext + GiGoodProvider + useGiGood export  
- [ ] Step 1e: Typecheck: `npx tsc --noEmit`

### Task 4: Create + update custom hooks

**Files:** Create `hooks/useAuth.ts`, `hooks/useChat.ts`, `hooks/useWallet.ts`; Modify `hooks/useJobs.ts`, `hooks/useNotifications.ts`, `hooks/useUi.ts`, `hooks/useSeeker.ts`, `hooks/useTasker.ts`

Each hook wraps `useGiGood()` and returns memoized derived data + dispatch wrappers.

- [ ] **Step 1: Create `hooks/useAuth.ts`** — profile, currentRole, isLoggedIn, signUpSeeker, signUpTasker, quickLogin, signOut, switchRole, setPendingRole  
- [ ] **Step 2: Create `hooks/useChat.ts`** — activeChatId, activeJob, chatDetailOpen, sendChat, openChat, closeChat. sendChat schedules cross-role notif after 1s.  
- [ ] **Step 3: Create `hooks/useWallet.ts`** — seekerWallet, taskerWallet, escrowHeldPool, wallet (role-aware), isSeeker  
- [ ] **Step 4: Rewrite `hooks/useJobs.ts`** — postJob, startMatching, acceptJob, reportCompleted, releaseEscrow, rateTasker + derived lists  
- [ ] **Step 5: Rewrite `hooks/useNotifications.ts`** — notifications, hasUnread, pushNotif, clearNotifs  
- [ ] **Step 6: Rewrite `hooks/useUi.ts`** — setSeekerSubTab, setTaskerSubTab, showToast, dismissToast + state  
- [ ] **Step 7: Rewrite `hooks/useSeeker.ts`** — activeJobs, history, chatJobs (memoized)  
- [ ] **Step 8: Rewrite `hooks/useTasker.ts`** — availableJobs, assignedJobs, earningsList, totalEarnings, completedCount, chatJobs  
- [ ] **Step 9: Typecheck:** `npx tsc --noEmit`

---

## Phase C: UI Components

### Task 5: Create shared UI components

**Files:** Create 8 files under `components/ui/`

- [ ] **Step 1: Create `StarRow.tsx`** — 5 FontAwesome star TouchableOpacity, value+onChange props, amber color  
- [ ] **Step 2: Create `ModalSheet.tsx`** — RN Modal (transparent, slide), black/50 overlay, white rounded-t-3xl container, drag handle, KeyboardAvoidingView  
- [ ] **Step 3: Create `ScreenHeader.tsx`** — SafeArea-aware row: back arrow (FontAwesome arrow-left) + title (font-bold text-base) + optional rightSlot  
- [ ] **Step 4: Create `AvatarPill.tsx`** — Circular Image with initials fallback onError, size prop  
- [ ] **Step 5: Create `IconPill.tsx`** — Row: icon + label (text-[9px] gray-500) + value (text-[11px] font-extrabold), customizable bg/border/iconColor  
- [ ] **Step 6: Create `SegmentedToggle.tsx`** — 2-option gray-100 p-1 rounded-xl container, active option white shadow-sm  
- [ ] **Step 7: Create `StatusBadge.tsx`** — Colored pill: finding=amber, assigned=blue, reported=emerald, completed=emerald  
- [ ] **Step 8: Create `FormField.tsx`** — Label (text-xs font-bold) + TextInput (rounded-2xl border) + optional icon + helper text

---

## Phase D: Auth Screens

### Task 6: Set up root + auth layout

**Files:** Modify `app/_layout.tsx`

- [ ] **Step 1: Rewrite `app/_layout.tsx`** to mount GiGoodProvider > Stack (no header) with (auth) and (app) screens + Toast + StatusBar dark  
- [ ] **Step 2: Keep `app/(auth)/_layout.tsx`** as Stack with no header (no changes needed)

### Task 7: Create auth screens (5 files)

**Files:** Create `app/(auth)/welcome.tsx`, `login.tsx`, `role-select.tsx`, `signup-basic.tsx`, `signup-tasker-profile.tsx`; Delete old `signup-seeker.tsx` and `signup-tasker.tsx`

Each screen matches the corresponding `<section id="screen-*">` in the HTML 1:1.

- [ ] **Step 1: Create `welcome.tsx`** — Orange gradient (bg-orange-500), decorative circles (absolute positioning, white/10, white/5), "Dự án GiGood" badge, GiGood title (5xl, font-extrabold, Poppins), 3 feature bullets (shield-halved, map-location-dot, star), "Bắt đầu ngay" button → role-select, "Tôi đã có tài khoản" → login, copyright footer  
- [ ] **Step 2: Create `login.tsx`** — Header with back + "Đăng nhập", phone input (phone icon), password input (lock icon), "Đăng nhập" button, divider "Hoặc dùng tài khoản mẫu", 2 quick-login cards (Khánh Vy seeker orange-bordered, Minh Quân tasker teal-bordered) dispatching QUICK_LOGIN → router.replace('/(app)'), "Chưa có tài khoản? Đăng ký ngay" link  
- [ ] **Step 3: Create `role-select.tsx`** — Header with back + "Tạo tài khoản", "Bạn muốn dùng GiGood để làm gì?" heading, 2 large cards with icon+title+subtitle+chevron, "Đã có tài khoản? Đăng nhập" link  
- [ ] **Step 4: Create `signup-basic.tsx`** — Role-aware header (orange/teal), progress dots (1/2 filled), form: name, phone (with helper text), password, location (location-dot icon), terms Switch, "Tiếp tục" button (stoneDark for seeker, teal for tasker)  
- [ ] **Step 5: Create `signup-tasker-profile.tsx`** — Progress dots (2/2 teal), info banner (circle-info), avatar preview, 4 skill buttons (2×2 grid, multi-select toggle), bio TextInput, availability select (dropdown), vehicle select, CCCD placeholder banner, "Hoàn tất hồ sơ" teal button  
- [ ] **Step 6: Delete old files:** `Remove-Item "app/(auth)/signup-seeker.tsx", "app/(auth)/signup-tasker.tsx"`  
- [ ] **Step 7: Typecheck:** `npx tsc --noEmit`

---

## Phase E: App Shell + Navigation

### Task 8: Rewrite app layout with sticky header

**Files:** Modify `app/(app)/_layout.tsx`

- [ ] **Step 1: Rewrite `_layout.tsx`** with these sections inside SafeAreaView:

**Header block (bg-white border-b border-gray-200 px-4 pb-3 relative z-30):**
- Top row: "GiGood" text (text-orange-500 text-xl font-extrabold Poppins) + role badge (orange/teal pill) | notification bell (w-9 h-9 rounded-xl, conditional red dot) + avatar (w-9 h-9 rounded-xl)
- Role switcher: gray-100 p-1 rounded-xl, 2 buttons (Người Thuê/Người Nhận) with active state (bg-white shadow-sm, orange/teal text)
- Wallet+Escrow cards: 2-column grid, shield-halved icon + escrow amount (teal) | wallet icon + role-aware wallet amount
- Notification dropdown: absolute positioned, white rounded-2xl shadow-xl, shows notification list with "Xóa hết" button, auto-closes on tap outside

**Content area:**
- Stack with (tabs), profile, notifications (modal), chat/[id] (no header)
- Redirect to welcome if profile is null

- [ ] **Step 2: Typecheck:** `npx tsc --noEmit`

### Task 9: Rewrite tab bar

**Files:** Modify `app/(app)/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite `_layout.tsx`** to use FontAwesome icons:

Seeker tabs: post (plus-circle "Đăng việc"), jobs (list-check "Việc của tôi"), chat (comment-dots "Tin nhắn"), history (receipt "Lịch sử")
Tasker tabs: board (map-location-dot "Bảng việc"), active (briefcase "Đã nhận"), chat (comment-dots "Tin nhắn"), earnings (sack-dollar "Thu nhập")

Active color: seeker=#ea580c (orange), tasker=#0f766e (teal)
Inactive: #9ca3af (gray-400)
Tab bar: white bg, border-top gray-200, pb-safe (paddingBottom: 10, height: 60)

Read currentRole from useAuth() to conditionally render the correct tab set.

- [ ] **Step 2: Typecheck:** `npx tsc --noEmit`

---

## Phase F: Seeker Screens

### Task 10: Rewrite post.tsx with quick templates

**Files:** Modify `app/(app)/(tabs)/post.tsx`

- [ ] **Step 1: Rewrite with HTML's seeker-sub-create layout:**

Quick template grid (2×2): 4 buttons matching HTML's repair/cleaning/delivery/helper templates with FontAwesome icons
Form: title input, category pill selector (4 CATEGORY_META labels), description TextInput (3 rows), budget+VND input + urgency toggle row, location input with location-dot icon
Info banner: shield-halved + escrow explanation
Submit button: bg-orange-500, "Đăng việc & Tìm Tasker ngay", dispatches POST_JOB then navigates to jobs tab

- [ ] **Step 2: Typecheck**

### Task 11: Rewrite jobs.tsx with matching radar

**Files:** Modify `app/(app)/(tabs)/jobs.tsx`

- [ ] **Step 1: Rewrite with HTML's seeker-sub-jobs layout:**

Matching radar panel: shown when matchingJobIdRef is set. Pulsing circle (Animated.View with scale 1→2.4, opacity 1→0, 2s loop), satellite-dish icon, "Đang tìm Tasker phù hợp...", job title, timer seconds
Matched tasker card: shown when job just matched (timeTag === 'Vừa ghép việc'). Orange border-2, "Đã ghép việc!" badge, avatar+name+rating, "Mở trò chuyện" button
Active jobs list: each card shows category icon (orange-50 bg), title, timeTag, status badge (finding=amber, reported=emerald, assigned=blue), description (2 lines), location+budget row, tasker name if present, action button (xác nhận/chat depending on status)

- [ ] **Step 2: Typecheck**

### Task 12: Rewrite chat.tsx with inline detail

**Files:** Modify `app/(app)/(tabs)/chat.tsx`

- [ ] **Step 1: Rewrite with combined sidebar+detail view:**

Chat list: FlatList of assigned/completed jobs, each showing avatar (tasker for seeker, seeker for tasker), partner name, last message preview
Chat detail: hidden until openChat() called. Header with back+avatar+name+job tag. ScrollView thread of ChatBubble messages (orange-500 or teal-600 bg for own messages, white border for other). Input bar with rounded-full TextInput + send button (orange/teal circle)

- [ ] **Step 2: Typecheck**

### Task 13: Rewrite history.tsx

**Files:** Modify `app/(app)/(tabs)/history.tsx`

- [ ] **Step 1: Rewrite with HTML's seeker-sub-history:**

"Lịch sử giao dịch" heading. FlatList of completed jobs. Each card: title + "Hoàn thành" pill (emerald), tasker name, rating stars (★) or "Chưa đánh giá", budget (negative, gray-800)

- [ ] **Step 2: Typecheck**

---

## Phase G: Tasker Screens

### Task 14: Rewrite board.tsx with mini map

**Files:** Modify `app/(app)/(tabs)/board.tsx`

- [ ] **Step 1: Rewrite with HTML's tasker-sub-board:**

"Việc gần bạn" heading. Mini map: h-44 rounded-2xl overflow-hidden relative bg-stone-100, 5 grid lines (absolute horizontal/vertical thin gray-300), user position marker (teal-600/30 pulse ring + teal-600 dot), job markers (orange-500 circles with category icons at job.mapX/mapY positions)
Available jobs list: each card with category icon (tealLight bg, teal icon), title+label+timeTag, budget (teal), description, location, "Nhận việc này" teal button → dispatches ACCEPT_JOB, shows toast, switches to active tab

- [ ] **Step 2: Typecheck**

### Task 15: Rewrite active.tsx

**Files:** Modify `app/(app)/(tabs)/active.tsx`

- [ ] **Step 1: Rewrite with HTML's tasker-sub-active:**

"Việc đã nhận" heading. FlatList of assigned jobs. Each card: category icon (tealLight), title, "Khách: {seekerName}", budget (teal), location, "Trò chuyện" button → opens chat detail, "Báo đã hoàn thành" orange button → dispatches REPORT_COMPLETED, opens tasker rating modal

- [ ] **Step 2: Typecheck**

### Task 16: Rewrite earnings.tsx

**Files:** Modify `app/(app)/(tabs)/earnings.tsx`

- [ ] **Step 1: Rewrite with HTML's tasker-sub-earnings:**

"Thu nhập của bạn" heading. 2 stat cards (2-column grid): total earnings (sack-dollar teal, font-extrabold) + completed count (circle-check orange)
"Lịch sử nhận tiền" section: FlatList of completed jobs, each showing title, seekerName, +amount (emerald-600)

- [ ] **Step 2: Typecheck**

---

## Phase H: Profile + Modals

### Task 17: Rewrite profile screen

**Files:** Modify `app/(app)/profile.tsx`

- [ ] **Step 1: Rewrite matching HTML screen-profile:**

ScreenHeader with back + "Hồ sơ của tôi". Avatar (w-16 h-16 rounded-2xl) + name (font-extrabold text-lg) + role tag (orange/teal) + member tier (amber star)
Tasker details section (hidden for seeker): skill pills (tealLight bg), bio, availability (clock icon), vehicle (motorcycle icon). CCCD banner: id-card icon, "Xác thực danh tính", "Chưa xác thực" amber label
Info rows: phone, location
"Đăng xuất" button: bg-red-50 text-red-500 → dispatches SIGN_OUT, router.replace to welcome

- [ ] **Step 2: Typecheck**

### Task 18: Add completion + rating modals

**Files:** Modify `app/(app)/_layout.tsx` to include modals, or create standalone modal screens with transparentModal presentation

- [ ] **Step 1: Create seeker completion modal** (inline in _layout or as modal screen)

Text: "Xác nhận hoàn thành công việc" + "Giải ngân ký quỹ và đánh giá nhé"
Amount card: bg-stone-50, job budget
StarRow: 5 FontAwesome stars, amber-400 active, gray-200 inactive
Comment TextInput: "Viết vài lời nhận xét..."
2 buttons: "Để sau" (stone-100) + "Giải ngân & Gửi đánh giá" (teal-600) → dispatches RELEASE_ESCROW

- [ ] **Step 2: Create tasker rating modal**

Text: "Đánh giá khách hàng" + "Đã báo hoàn thành công việc..."
StarRow + comment input
2 buttons: "Để sau" + "Gửi đánh giá" (orange-500) → dispatches RATE_TASKER

- [ ] **Step 3: Wire modals** — seeker completion modal opens when user taps "Xác nhận & Giải ngân" on a reported-complete job; tasker rating modal opens automatically after REPORT_COMPLETED dispatch

- [ ] **Step 4: Verify Toast** component still works (mounted at root, reads ui.toast, auto-hides 3.5s)

---

## Phase I: Verification

### Task 19: Run quality gates

- [ ] **Step 1: Typecheck:** `npx tsc --noEmit` — fix all type errors  
- [ ] **Step 2: Lint:** `npx expo lint` — fix all lint errors  
- [ ] **Step 3: Verify app.json** has correct name/slug  
- [ ] **Step 4: Manual smoke:** `npx expo start` — walk through all screens: welcome → login (quick-login both roles) → signup (both seeker and tasker) → post job → matching radar → accept job (switch role) → chat both ways → report complete → release escrow → rate → check history + earnings

---

## Self-Review Checklist

1. **Spec coverage:** Every section in the HTML has a corresponding task: welcome ✓, login ✓, role-select ✓, signup-basic ✓, signup-tasker-profile ✓, main header ✓, role switcher ✓, wallet/escrow ✓, notif tray ✓, seeker tabs ✓, tasker tabs ✓, post with templates ✓, matching radar ✓, mini map ✓, chat inline ✓, active/history/earnings cards ✓, profile ✓, completion modal ✓, tasker rating modal ✓, toast ✓

2. **Placeholder scan:** No TBD/TODO/fill-in-later patterns. Every task references exact HTML behavior.

3. **Type consistency:** All types match between tasks: Category = repair|cleaning|delivery|helper, state shape matches HTML's window.GiGoodState, reducer actions mirror HTML's JS functions.

4. **Migration plan:** Existing components (Button, Input, CategoryGrid, JobCard, ChatBubble, etc.) should be handled by the screens using inline layout matching HTML rather than trying to reuse old components that don't match the design.

---

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per phase, review between phases, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans skill, batch execution with checkpoints

Which approach?
