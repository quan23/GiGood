# GiGood Frontend Expo Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `assets/index.html` 1:1 as a working Expo SDK 54 mobile app, using Expo Router, NativeWind v4, React Context + useReducer (no extra state-management deps), Vietnamese UI, session-only data.

**Architecture:** File-based routes grouped by app state (`(auth)/` and `(app)/`); one global `GiGoodContext` with a single `useReducer`; 12 reusable components under `components/ui/`; 19 screen/modal files under `app/`; no backend, no persistence.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19.1, TypeScript 5.9 (strict), Expo Router 6, NativeWind 4.2 + Tailwind 3.4, Reanimated 4, SafeAreaContext 5, `expo-image` for avatars, `@expo/vector-icons` (FontAwesome) for icons.

**Reference spec:** `docs/superpowers/specs/2026-06-21-gigood-frontend-demo-design.md` — every task in this plan links back to a section in that spec.

**Verification convention:** For each task, the "verification" step runs `npx tsc --noEmit` + `npx expo lint` from the repo root. Both must report zero errors/warnings before committing.

**File-header convention:** All new files start with the AGENTS.md rule: **DO NOT ADD COMMENTS unless asked**. Code blocks below contain only code, no `//` or `/* */` comments.

---

## Phase 1: Setup & Configuration

### Task 1.1: Downgrade Expo packages to SDK 54

**Files:**
- Modify: `package.json`
- Auto: `package-lock.json` (regenerated)

The current `package.json` pins Expo SDK 56 packages. We need SDK 54.

- [ ] **Step 1: Run `expo install --fix` to align with SDK 54**

```bash
npx expo install --fix
```

Expected: many package versions are rewritten. Look for these key downgrades in the output:
- `expo` → `~54.0.0`
- `react-native` → `0.81.x`
- `expo-router` → `~6.0.0`
- `expo-secure-store` → `~14.0.0`
- `expo-image` → `~3.0.x`
- `expo-constants` → `~18.0.x`
- `expo-linking` → `~8.0.x`

- [ ] **Step 2: If `expo-notifications` couldn't be resolved, remove it**

```bash
npm uninstall expo-notifications
```

(If the package still exists and the install succeeded, leave it. We don't use it in the demo.)

- [ ] **Step 3: Verify versions**

```bash
node -p "JSON.stringify({expo: require('./package.json').dependencies.expo, rn: require('./package.json').dependencies['react-native'], router: require('./package.json').dependencies['expo-router']}, null, 2)"
```

Expected: prints `expo: ~54.x.x`, `rn: 0.81.x`, `router: ~6.x.x`.

- [ ] **Step 4: Verify typecheck still works**

```bash
npx tsc --noEmit
```

Expected: zero errors. (Errors in files we haven't written yet are acceptable; the install itself shouldn't break compilation of existing TS.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: downgrade Expo packages to SDK 54"
```

---

### Task 1.2: Configure NativeWind v4

**Files:**
- Create: `babel.config.js`
- Create: `metro.config.js`
- Create: `tailwind.config.js`
- Create: `global.css`
- Modify: `app/_layout.tsx` (import global.css)
- Delete: template boilerplate

NativeWind v4 is installed but not configured. Per [spec §2 §7.5].

- [ ] **Step 1: Create `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 2: Create `metro.config.js`**

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 3: Create `tailwind.config.js` with brand tokens**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ea580c",
          orangeHover: "#c2410c",
          orangeLight: "#ffedd5",
          teal: "#0f766e",
          tealHover: "#115e59",
          tealLight: "#f0fdfa",
          stoneDark: "#1c1917",
          stoneLight: "#fafaf9",
          stoneBorder: "#e7e5e4",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Replace `app/_layout.tsx` with the NativeWind-aware root**

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GiGoodProvider } from "@/lib/GiGoodContext";
import { Toast } from "@/components/ui/Toast";

export default function RootLayout() {
  return (
    <GiGoodProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
      <Toast />
    </GiGoodProvider>
  );
}
```

(`GiGoodProvider` and `Toast` are added in Phase 2 and Phase 3 respectively. The file will typecheck-clean at the end of Phase 2.)

- [ ] **Step 6: Remove template boilerplate**

```bash
rm -rf "app/(main)" "app/(tabs)" "app/explore.tsx" "app/modal.tsx" "components/external-link.tsx" "components/haptic-tab.tsx" "components/hello-wave.tsx" "components/parallax-scroll-view.tsx" "components/themed-text.tsx" "components/themed-view.tsx" "components/theme.ts" "components/ui" "hooks/use-color-scheme.ts" "hooks/use-color-scheme.web.ts" "hooks/use-theme-color.ts"
```

(`constants/theme.ts` is replaced in Phase 2; `app/index.tsx` and `app/_layout.tsx` are replaced in this task.)

- [ ] **Step 7: Commit**

```bash
git add babel.config.js metro.config.js tailwind.config.js global.css app/_layout.tsx
git add -u
git commit -m "chore: configure NativeWind v4 and remove Expo template boilerplate"
```

---

## Phase 2: Foundation (types, state, hooks, helpers)

### Task 2.1: Types and helper modules

**Files:**
- Create: `types/index.ts`
- Create: `lib/categories.ts`
- Create: `lib/format.ts`
- Create: `lib/seed.ts`
- Modify: `constants/theme.ts` (replace with stub)

Implements spec §3.2 type definitions and §4.4 helpers.

- [ ] **Step 1: Create `types/index.ts`**

```ts
export type Role = "seeker" | "tasker";

export type Category = "repair" | "cleaning" | "delivery" | "helper";
export type Availability = "all-day" | "morning" | "afternoon" | "evening" | "weekend";
export type Vehicle = "motorbike" | "car" | "bike" | "none";

export type TaskerProfile = {
  skills: Category[];
  bio: string;
  availability: Availability;
  vehicle: Vehicle;
  verified: boolean;
};

export type UserProfile = {
  name: string;
  avatar: string;
  role: Role;
  phone: string;
  location: string;
  taskerProfile: TaskerProfile | null;
};

export type ChatMessage = {
  sender: Role;
  text: string;
  time: string;
};

export type JobStatus = "finding" | "assigned" | "completed";

export type Job = {
  id: number;
  title: string;
  category: Category;
  budget: number;
  location: string;
  description: string;
  status: JobStatus;
  seekerName: string;
  taskerName: string | null;
  timeTag: string;
  chats: ChatMessage[];
  seekerRating: number | null;
  taskerRating: number | null;
  isCompletedReportedByTasker: boolean;
  mapX: string;
  mapY: string;
};

export type Notification = {
  id: number;
  text: string;
  time: string;
  read: boolean;
};

export type SeekerSubTab = "post" | "jobs" | "chat" | "history";
export type TaskerSubTab = "board" | "active" | "chat" | "earnings";

export type ToastVariant = "success" | "error" | "info";
export type Toast = {
  message: string;
  variant: ToastVariant;
  visible: boolean;
};

export type GiGoodState = {
  auth: {
    profile: UserProfile | null;
    currentRole: Role;
    pendingSignupRole: Role;
  };
  ui: {
    activeSeekerSubTab: SeekerSubTab;
    activeTaskerSubTab: TaskerSubTab;
    activeChatId: number | null;
    chatDetailOpen: boolean;
    notifOpen: boolean;
    notifBadge: boolean;
    matchingJobIdRef: number | null;
    toast: Toast | null;
  };
  data: {
    jobs: Job[];
    notifications: Notification[];
    seekerWallet: number;
    taskerWallet: number;
    escrowHeldPool: number;
  };
};
```

- [ ] **Step 2: Create `lib/categories.ts`**

```ts
import type { Availability, Category, Vehicle } from "@/types";

export type CategoryMeta = {
  label: string;
  icon: string;
  accent: "orange" | "teal";
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  repair: { label: "Sửa chữa vặt", icon: "wrench", accent: "orange" },
  cleaning: { label: "Dọn dẹp nhà cửa", icon: "magic", accent: "teal" },
  delivery: { label: "Vận chuyển/Giao hàng", icon: "motorcycle", accent: "orange" },
  helper: { label: "Hỗ trợ/Nhờ việc vặt", icon: "handshake-o", accent: "teal" },
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  "all-day": "Cả ngày, linh hoạt",
  morning: "Buổi sáng (6h-12h)",
  afternoon: "Buổi chiều (12h-18h)",
  evening: "Buổi tối (18h-22h)",
  weekend: "Chỉ cuối tuần",
};

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  motorbike: "Xe máy",
  car: "Ô tô",
  bike: "Xe đạp",
  none: "Đi bộ / không có xe",
};
```

- [ ] **Step 3: Create `lib/format.ts`**

```ts
export function formatVND(num: number): string {
  return num.toLocaleString("vi-VN") + " VND";
}

export function formatRelativeTime(): string {
  return "Vừa xong";
}
```

- [ ] **Step 4: Create `lib/seed.ts`**

Matches the HTML's initial `window.GiGoodState` (2 sample jobs, wallets, escrow, notifications empty).

```ts
import type { GiGoodState, Job } from "@/types";

const SAMPLE_TASKERS = [
  { name: "Minh Quân T.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=QT" },
  { name: "Anh Hào D.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=HD" },
  { name: "Thành Long P.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=LP" },
];

export const SEEKER_AVATAR = "https://placehold.co/100x100/ea580c/ffffff?text=KV";
export const TASKER_AVATAR = "https://placehold.co/100x100/0f766e/ffffff?text=Qu";

export const SEED_JOBS: Job[] = [
  {
    id: 201,
    title: "Khơi thông thoát sàn toilet tràn nước",
    category: "repair",
    budget: 150000,
    location: "120 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
    description:
      "Đường thoát nước phòng tắm bị tắc rác bẩn gây tràn. Cần thợ đem theo dây thông tắc lò xo dài tối thiểu 3m xử lý triệt để.",
    status: "assigned",
    seekerName: "Khánh Vy",
    taskerName: "Minh Quân T.",
    timeTag: "25 phút trước",
    chats: [
      { sender: "tasker", text: "Chào chị Vy, em vừa nhận đơn thông thoát sàn của mình. Em chuẩn bị đồ đạc rồi chạy qua liền đây chị nha.", time: "10:42" },
      { sender: "seeker", text: "Chào em, nhớ mang theo máy thông tắc lò xo loại lớn nhé. Đường cống nhà chị dài lắm.", time: "10:44" },
      { sender: "tasker", text: "Dạ vâng ạ, máy lò xo em bỏ sẵn sau xe rồi, tầm 10 phút nữa em có mặt chị ạ.", time: "10:45" },
    ],
    seekerRating: null,
    taskerRating: null,
    isCompletedReportedByTasker: false,
    mapX: "20%",
    mapY: "45%",
  },
  {
    id: 202,
    title: "Giao gấp hộp bánh ngọt cho khách hàng",
    category: "delivery",
    budget: 45000,
    location: "88 Pasteur, Quận 1 đến Quận 3",
    description:
      "Cần một bạn shipper chạy cẩn thận bọc màng khí tránh va đập hư hỏng trang trí mặt bánh.",
    status: "finding",
    seekerName: "Khánh Vy",
    taskerName: null,
    timeTag: "2 giờ trước",
    chats: [],
    seekerRating: null,
    taskerRating: null,
    isCompletedReportedByTasker: false,
    mapX: "70%",
    mapY: "35%",
  },
];

export const SEEKER_WALLET_INITIAL = 1_420_000;
export const TASKER_WALLET_INITIAL = 2_850_000;
export const ESCROW_POOL_INITIAL = 150_000;

export const SEED_STATE: GiGoodState = {
  auth: {
    profile: null,
    currentRole: "seeker",
    pendingSignupRole: "seeker",
  },
  ui: {
    activeSeekerSubTab: "post",
    activeTaskerSubTab: "board",
    activeChatId: null,
    chatDetailOpen: false,
    notifOpen: false,
    notifBadge: false,
    matchingJobIdRef: null,
    toast: null,
  },
  data: {
    jobs: SEED_JOBS,
    notifications: [],
    seekerWallet: SEEKER_WALLET_INITIAL,
    taskerWallet: TASKER_WALLET_INITIAL,
    escrowHeldPool: ESCROW_POOL_INITIAL,
  },
};

export { SAMPLE_TASKERS };
```

- [ ] **Step 5: Replace `constants/theme.ts` with a stub**

```ts
export {};
```

- [ ] **Step 6: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors. (`app/_layout.tsx` still references `GiGoodProvider` and `Toast` which don't exist yet — those land in Tasks 2.2 and 3.2.)

- [ ] **Step 7: Commit**

```bash
git add types/index.ts lib/categories.ts lib/format.ts lib/seed.ts constants/theme.ts
git commit -m "feat(foundation): add types, helpers, and seed data"
```

---

### Task 2.2: Reducer, Context, and Hooks

**Files:**
- Create: `lib/GiGoodContext.tsx`
- Create: `hooks/useSeeker.ts`
- Create: `hooks/useTasker.ts`
- Create: `hooks/useJobs.ts`
- Create: `hooks/useNotifications.ts`
- Create: `hooks/useUi.ts`

Implements spec §3 (state design) and §4.5 (hooks).

- [ ] **Step 1: Create `lib/GiGoodContext.tsx` with reducer (draft v1)**

The full reducer is large; we build it in 4 sub-steps to keep diffs reviewable. This Step 1 lands the file skeleton + initial action set.

```tsx
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { SEED_STATE } from "./seed";
import type {
  Availability,
  Category,
  ChatMessage,
  GiGoodState,
  Job,
  Notification,
  Role,
  SeekerSubTab,
  TaskerSubTab,
  ToastVariant,
  Vehicle,
} from "@/types";

type Action =
  | { type: "LOGIN"; profile: GiGoodState["auth"]["profile"] }
  | { type: "LOGOUT" }
  | { type: "SIGNUP_START"; role: Role }
  | { type: "SET_PENDING_ROLE"; role: Role }
  | { type: "SWITCH_ROLE"; role: Role }
  | { type: "SET_SEEKER_SUBTAB"; tab: SeekerSubTab }
  | { type: "SET_TASKER_SUBTAB"; tab: TaskerSubTab }
  | { type: "OPEN_CHAT_DETAIL"; jobId: number }
  | { type: "CLOSE_CHAT_DETAIL" }
  | { type: "SET_ACTIVE_CHAT"; jobId: number | null }
  | { type: "OPEN_NOTIFS" }
  | { type: "CLOSE_NOTIFS" }
  | { type: "MARK_NOTIFS_READ" }
  | { type: "PUSH_NOTIF"; text: string; time: string }
  | { type: "CLEAR_NOTIFS" }
  | { type: "SET_MATCHING_REF"; jobId: number | null }
  | { type: "SHOW_TOAST"; message: string; variant: ToastVariant }
  | { type: "HIDE_TOAST" }
  | { type: "POST_JOB"; job: Job }
  | { type: "ACCEPT_JOB"; jobId: number; taskerName: string }
  | { type: "REPORT_COMPLETION"; jobId: number; role: Role }
  | { type: "RATE_JOB"; jobId: number; role: Role; rating: number }
  | { type: "SEND_MESSAGE"; jobId: number; message: ChatMessage }
  | { type: "WITHDRAW" }
  | { type: "UPDATE_TASKER_PROFILE"; skills: Category[]; bio: string; availability: Availability; vehicle: Vehicle };

function reducer(state: GiGoodState, action: Action): GiGoodState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        auth: { ...state.auth, profile: action.profile },
      };
    case "LOGOUT":
      return { ...state, auth: { ...state.auth, profile: null } };
    case "SIGNUP_START":
      return {
        ...state,
        auth: { ...state.auth, pendingSignupRole: action.role },
      };
    case "SET_PENDING_ROLE":
      return {
        ...state,
        auth: { ...state.auth, pendingSignupRole: action.role },
      };
    case "SWITCH_ROLE": {
      const profile = state.auth.profile;
      if (!profile) return state;
      return { ...state, auth: { ...state.auth, currentRole: action.role, profile: { ...profile, role: action.role } } };
    }
    case "SET_SEEKER_SUBTAB":
      return { ...state, ui: { ...state.ui, activeSeekerSubTab: action.tab } };
    case "SET_TASKER_SUBTAB":
      return { ...state, ui: { ...state.ui, activeTaskerSubTab: action.tab } };
    case "OPEN_CHAT_DETAIL":
      return { ...state, ui: { ...state.ui, chatDetailOpen: true, activeChatId: action.jobId } };
    case "CLOSE_CHAT_DETAIL":
      return { ...state, ui: { ...state.ui, chatDetailOpen: false } };
    case "SET_ACTIVE_CHAT":
      return { ...state, ui: { ...state.ui, activeChatId: action.jobId } };
    case "OPEN_NOTIFS":
      return { ...state, ui: { ...state.ui, notifOpen: true } };
    case "CLOSE_NOTIFS":
      return { ...state, ui: { ...state.ui, notifOpen: false } };
    case "MARK_NOTIFS_READ":
      return {
        ...state,
        data: {
          ...state.data,
          notifications: state.data.notifications.map((n) => ({ ...n, read: true })),
        },
        ui: { ...state.ui, notifBadge: false },
      };
    case "PUSH_NOTIF": {
      const next: Notification = { id: Date.now(), text: action.text, time: action.time, read: false };
      return {
        ...state,
        data: { ...state.data, notifications: [next, ...state.data.notifications] },
        ui: { ...state.ui, notifBadge: true },
      };
    }
    case "CLEAR_NOTIFS":
      return {
        ...state,
        data: { ...state.data, notifications: [] },
        ui: { ...state.ui, notifBadge: false },
      };
    case "SET_MATCHING_REF":
      return { ...state, ui: { ...state.ui, matchingJobIdRef: action.jobId } };
    case "SHOW_TOAST":
      return { ...state, ui: { ...state.ui, toast: { message: action.message, variant: action.variant, visible: true } } };
    case "HIDE_TOAST":
      return { ...state, ui: { ...state.ui, toast: state.ui.toast ? { ...state.ui.toast, visible: false } : null } };
    case "POST_JOB":
      return { ...state, data: { ...state.data, jobs: [action.job, ...state.data.jobs] } };
    case "ACCEPT_JOB":
      return {
        ...state,
        data: {
          ...state.data,
          jobs: state.data.jobs.map((j) =>
            j.id === action.jobId ? { ...j, status: "assigned", taskerName: action.taskerName } : j,
          ),
        },
      };
    case "REPORT_COMPLETION": {
      const job = state.data.jobs.find((j) => j.id === action.jobId);
      if (!job) return state;
      const otherSideReady = action.role === "seeker" ? job.isCompletedReportedByTasker : true;
      if (!otherSideReady && action.role === "tasker") {
        return {
          ...state,
          data: {
            ...state.data,
            jobs: state.data.jobs.map((j) =>
              j.id === action.jobId ? { ...j, isCompletedReportedByTasker: true } : j,
            ),
          },
        };
      }
      return {
        ...state,
        data: {
          ...state.data,
          jobs: state.data.jobs.map((j) => (j.id === action.jobId ? { ...j, status: "completed" } : j)),
        },
      };
    }
    case "RATE_JOB":
      return {
        ...state,
        data: {
          ...state.data,
          jobs: state.data.jobs.map((j) =>
            j.id === action.jobId
              ? action.role === "seeker"
                ? { ...j, seekerRating: action.rating }
                : { ...j, taskerRating: action.rating }
              : j,
          ),
        },
      };
    case "SEND_MESSAGE":
      return {
        ...state,
        data: {
          ...state.data,
          jobs: state.data.jobs.map((j) =>
            j.id === action.jobId ? { ...j, chats: [...j.chats, action.message] } : j,
          ),
        },
      };
    case "WITHDRAW":
      return { ...state };
    case "UPDATE_TASKER_PROFILE":
      if (!state.auth.profile) return state;
      return {
        ...state,
        auth: {
          ...state.auth,
          profile: {
            ...state.auth.profile,
            taskerProfile: {
              skills: action.skills,
              bio: action.bio,
              availability: action.availability,
              vehicle: action.vehicle,
              verified: true,
            },
          },
        },
      };
  }
}

type ContextShape = {
  state: GiGoodState;
  dispatch: Dispatch<Action>;
};

const GiGoodContext = createContext<ContextShape | null>(null);

export function GiGoodProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, SEED_STATE);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GiGoodContext.Provider value={value}>{children}</GiGoodContext.Provider>;
}

export function useGiGood(): ContextShape {
  const ctx = useContext(GiGoodContext);
  if (!ctx) throw new Error("useGiGood must be used within GiGoodProvider");
  return ctx;
}

export type { Action };
```

- [ ] **Step 2: Create `hooks/useSeeker.ts`**

```ts
import { useGiGood } from "@/lib/GiGoodContext";
import type { SeekerSubTab } from "@/types";

export function useSeeker() {
  const { state, dispatch } = useGiGood();
  const profile = state.auth.profile;
  const wallet = state.data.seekerWallet;
  const jobs = state.data.jobs;
  const activeSubTab = state.ui.activeSeekerSubTab;

  const myJobs = profile ? jobs.filter((j) => j.seekerName === profile.name) : [];

  return {
    profile,
    wallet,
    activeSubTab,
    myJobs,
    setSubTab: (tab: SeekerSubTab) => dispatch({ type: "SET_SEEKER_SUBTAB", tab }),
    showToast: (message: string, variant: "success" | "error" | "info" = "info") =>
      dispatch({ type: "SHOW_TOAST", message, variant }),
  };
}
```

- [ ] **Step 3: Create `hooks/useTasker.ts`**

```ts
import { useGiGood } from "@/lib/GiGoodContext";
import type { TaskerSubTab } from "@/types";

export function useTasker() {
  const { state, dispatch } = useGiGood();
  const profile = state.auth.profile;
  const wallet = state.data.taskerWallet;
  const escrowPool = state.data.escrowHeldPool;
  const jobs = state.data.jobs;
  const activeSubTab = state.ui.activeTaskerSubTab;

  const openJobs = jobs.filter((j) => j.status === "finding");
  const myActiveJobs = profile ? jobs.filter((j) => j.status === "assigned" && j.taskerName === profile.name) : [];
  const myCompletedJobs = profile
    ? jobs.filter((j) => j.status === "completed" && j.taskerName === profile.name)
    : [];

  return {
    profile,
    wallet,
    escrowPool,
    activeSubTab,
    openJobs,
    myActiveJobs,
    myCompletedJobs,
    setSubTab: (tab: TaskerSubTab) => dispatch({ type: "SET_TASKER_SUBTAB", tab }),
    showToast: (message: string, variant: "success" | "error" | "info" = "info") =>
      dispatch({ type: "SHOW_TOAST", message, variant }),
  };
}
```

- [ ] **Step 4: Replace `hooks/useJobs.ts` with the focused jobs hook**

(An earlier draft lived here; this is the FINAL version that exposes only what screens need.)

```ts
import { useGiGood } from "@/lib/GiGoodContext";
import type { Category, ChatMessage, Job, Role } from "@/types";

export function useJobs() {
  const { state, dispatch } = useGiGood();
  const jobs = state.data.jobs;

  const findById = (id: number | null) => jobs.find((j) => j.id === id) ?? null;

  const postJob = (input: {
    title: string;
    category: Category;
    budget: number;
    location: string;
    description: string;
    timeTag: string;
    seekerName: string;
    mapX: string;
    mapY: string;
  }): Job => {
    const id = Math.max(0, ...jobs.map((j) => j.id)) + 1;
    const job: Job = {
      id,
      title: input.title,
      category: input.category,
      budget: input.budget,
      location: input.location,
      description: input.description,
      status: "finding",
      seekerName: input.seekerName,
      taskerName: null,
      timeTag: input.timeTag,
      chats: [],
      seekerRating: null,
      taskerRating: null,
      isCompletedReportedByTasker: false,
      mapX: input.mapX,
      mapY: input.mapY,
    };
    dispatch({ type: "POST_JOB", job });
    return job;
  };

  const acceptJob = (jobId: number, taskerName: string) =>
    dispatch({ type: "ACCEPT_JOB", jobId, taskerName });

  const reportCompletion = (jobId: number, role: Role) =>
    dispatch({ type: "REPORT_COMPLETION", jobId, role });

  const rateJob = (jobId: number, role: Role, rating: number) =>
    dispatch({ type: "RATE_JOB", jobId, role, rating });

  const sendMessage = (jobId: number, message: ChatMessage) =>
    dispatch({ type: "SEND_MESSAGE", jobId, message });

  return { jobs, findById, postJob, acceptJob, reportCompletion, rateJob, sendMessage };
}
```

- [ ] **Step 5: Create `hooks/useNotifications.ts`**

```ts
import { useGiGood } from "@/lib/GiGoodContext";

export function useNotifications() {
  const { state, dispatch } = useGiGood();
  const list = state.data.notifications;
  const badge = state.ui.notifBadge;

  return {
    list,
    badge,
    open: () => dispatch({ type: "OPEN_NOTIFS" }),
    close: () => dispatch({ type: "CLOSE_NOTIFS" }),
    markRead: () => dispatch({ type: "MARK_NOTIFS_READ" }),
    push: (text: string, time: string) => dispatch({ type: "PUSH_NOTIF", text, time }),
    clear: () => dispatch({ type: "CLEAR_NOTIFS" }),
  };
}
```

- [ ] **Step 6: Create `hooks/useUi.ts`**

```ts
import { useGiGood } from "@/lib/GiGoodContext";
import type { ToastVariant } from "@/types";

export function useUi() {
  const { state, dispatch } = useGiGood();
  return {
    toast: state.ui.toast,
    showToast: (message: string, variant: ToastVariant = "info") =>
      dispatch({ type: "SHOW_TOAST", message, variant }),
    hideToast: () => dispatch({ type: "HIDE_TOAST" }),
  };
}
```

- [ ] **Step 7: Run typecheck and lint**

```bash
npx tsc --noEmit
npx expo lint
```

Expected: zero errors. `app/_layout.tsx` should now typecheck cleanly since `GiGoodProvider` and `Toast` exist (Toast arrives in Task 3.2; until then, temporarily comment out the `<Toast />` line to typecheck. We'll re-add it in Task 3.2 Step 6.)

- [ ] **Step 8: After Task 3.2 lands the Toast component, run typecheck again and confirm clean.**

- [ ] **Step 9: Commit**

```bash
git add lib/GiGoodContext.tsx hooks/
git commit -m "feat(foundation): add reducer, context, and typed hooks"
```

---

## Phase 3: Reusable UI Components

### Task 3.1: Primitive components (ScreenHeader, BottomTabs, StatusPill, Avatar)

**Files:**
- Create: `components/ui/ScreenHeader.tsx`
- Create: `components/ui/BottomTabs.tsx`
- Create: `components/ui/StatusPill.tsx`
- Create: `components/ui/Avatar.tsx`

Implements spec §4.1.

- [ ] **Step 1: Create `components/ui/ScreenHeader.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Props = {
  title: string;
  subtitle?: string;
  subtitleClass?: string;
  onBack?: () => void;
  onBell?: () => void;
  showBadge?: boolean;
  accent?: "orange" | "teal";
};

export function ScreenHeader({ title, subtitle, subtitleClass, onBack, onBell, showBadge, accent = "orange" }: Props) {
  const subtitleColorClass = subtitleClass ?? (accent === "orange" ? "text-brand-orange" : "text-brand-teal");
  return (
    <View className="bg-white px-5 pt-12 pb-4 border-b border-brand-stoneBorder flex-row items-center">
      {onBack ? (
        <Pressable onPress={onBack} className="mr-3 w-9 h-9 items-center justify-center" hitSlop={8}>
          <FontAwesome name="arrow-left" size={20} color="#1c1917" />
        </Pressable>
      ) : (
        <View className="w-9 h-9 mr-3" />
      )}
      <View className="flex-1">
        <Text className="text-[22px] font-poppins font-bold text-brand-stoneDark leading-tight" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className={`text-sm font-medium ${subtitleColorClass} mt-0.5`} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onBell ? (
        <Pressable onPress={onBell} className="w-9 h-9 items-center justify-center relative" hitSlop={8}>
          <FontAwesome name="bell" size={20} color="#1c1917" />
          {showBadge ? (
            <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-orange" />
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ui/BottomTabs.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import type { SeekerSubTab, TaskerSubTab } from "@/types";

type SeekerItem = { key: SeekerSubTab; icon: string; label: string };
type TaskerItem = { key: TaskerSubTab; icon: string; label: string };

const SEEKER_ITEMS: SeekerItem[] = [
  { key: "post", icon: "plus-circle", label: "Đăng" },
  { key: "jobs", icon: "list-alt", label: "Việc" },
  { key: "chat", icon: "comment", label: "Chat" },
  { key: "history", icon: "history", label: "Lịch sử" },
];

const TASKER_ITEMS: TaskerItem[] = [
  { key: "board", icon: "briefcase", label: "Bảng tin" },
  { key: "active", icon: "bolt", label: "Đang làm" },
  { key: "chat", icon: "comment", label: "Chat" },
  { key: "earnings", icon: "money", label: "Thu nhập" },
];

type Props =
  | { role: "seeker"; active: SeekerSubTab; onChange: (tab: SeekerSubTab) => void }
  | { role: "tasker"; active: TaskerSubTab; onChange: (tab: TaskerSubTab) => void };

export function BottomTabs(props: Props) {
  const items = props.role === "seeker" ? SEEKER_ITEMS : TASKER_ITEMS;
  const active = props.active;
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-brand-stoneBorder flex-row pb-6 pt-2">
      {items.map((it) => {
        const isActive = it.key === active;
        const color = isActive ? "#ea580c" : "#78716c";
        return (
          <Pressable
            key={it.key}
            onPress={() => props.onChange(it.key as never)}
            className="flex-1 items-center justify-center py-1"
          >
            <FontAwesome name={it.icon} size={22} color={color} />
            <Text className={`text-[11px] mt-1 font-medium ${isActive ? "text-brand-orange" : "text-stone-500"}`}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 3: Create `components/ui/StatusPill.tsx`**

```tsx
import { Text, View } from "react-native";
import type { JobStatus } from "@/types";

const STATUS_TEXT: Record<JobStatus, string> = {
  finding: "Đang tìm người",
  assigned: "Đã có tasker",
  completed: "Hoàn thành",
};

const STATUS_BG: Record<JobStatus, string> = {
  finding: "bg-brand-orangeLight",
  assigned: "bg-brand-tealLight",
  completed: "bg-stone-200",
};

const STATUS_TEXT_COLOR: Record<JobStatus, string> = {
  finding: "text-brand-orange",
  assigned: "text-brand-teal",
  completed: "text-stone-600",
};

export function StatusPill({ status }: { status: JobStatus }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${STATUS_BG[status]}`}>
      <Text className={`text-xs font-semibold ${STATUS_TEXT_COLOR[status]}`}>{STATUS_TEXT[status]}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Create `components/ui/Avatar.tsx`**

```tsx
import { Image, Text, View } from "react-native";

type Props = {
  uri: string;
  name: string;
  size?: number;
  ringClass?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(-1)[0]?.slice(0, 1).toUpperCase() ?? "?";
}

export function Avatar({ uri, name, size = 48, ringClass }: Props) {
  return (
    <View
      className={`rounded-full overflow-hidden bg-stone-200 items-center justify-center ${ringClass ?? ""}`}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          accessibilityLabel={`${name} avatar`}
        />
      ) : (
        <Text style={{ fontSize: size * 0.4 }} className="font-poppins font-bold text-stone-500">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add components/ui/ScreenHeader.tsx components/ui/BottomTabs.tsx components/ui/StatusPill.tsx components/ui/Avatar.tsx
git commit -m "feat(ui): add ScreenHeader, BottomTabs, StatusPill, Avatar"
```

---

### Task 3.2: Toast, Modal, Button, Field, StarRating, MiniMap

**Files:**
- Create: `components/ui/Toast.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Field.tsx`
- Create: `components/ui/StarRating.tsx`
- Create: `components/ui/MiniMap.tsx`

Implements spec §4.1.

- [ ] **Step 1: Create `components/ui/Toast.tsx`**

```tsx
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";
import { useUi } from "@/hooks/useUi";

const VARIANT_STYLE = {
  success: "bg-brand-teal",
  error: "bg-red-600",
  info: "bg-brand-stoneDark",
} as const;

const VARIANT_ICON = {
  success: "check-circle",
  error: "exclamation-triangle",
  info: "info-circle",
} as const;

export function Toast() {
  const { toast, hideToast } = useUi();

  useEffect(() => {
    if (!toast?.visible) return;
    const t = setTimeout(() => hideToast(), 3000);
    return () => clearTimeout(t);
  }, [toast, hideToast]);

  if (!toast || !toast.visible) return null;

  return (
    <View pointerEvents="box-none" className="absolute inset-0 items-center justify-end pb-32 px-5 z-50">
      <Animated.View
        entering={FadeInUp.duration(220)}
        exiting={FadeOutDown.duration(180)}
        className={`rounded-2xl px-4 py-3 flex-row items-center w-full shadow-lg ${VARIANT_STYLE[toast.variant]}`}
      >
        <FontAwesome name={VARIANT_ICON[toast.variant]} size={18} color="white" />
        <Text className="text-white text-sm font-medium ml-3 flex-1">{toast.message}</Text>
        <Pressable onPress={hideToast} hitSlop={8}>
          <Text className="text-white/80 text-lg">×</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ui/Modal.tsx`**

```tsx
import { type ReactNode } from "react";
import { Modal as RNModal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ visible, onClose, title, children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <Pressable onPress={onClose} className="flex-1" />
        <View className="bg-white rounded-t-3xl px-5 pt-3 pb-8 max-h-[85%]">
          <View className="w-10 h-1 bg-stone-300 rounded-full self-center mb-4" />
          {title ? (
            <Text className="text-lg font-poppins font-bold text-brand-stoneDark mb-3">{title}</Text>
          ) : null}
          {children}
        </View>
      </View>
    </RNModal>
  );
}
```

- [ ] **Step 3: Create `components/ui/Button.tsx`**

```tsx
import { type ReactNode } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  onPress: () => void;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  iconLeft?: string;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-brand-orange",
  secondary: "bg-brand-teal",
  ghost: "bg-transparent",
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-white",
  ghost: "text-brand-orange",
};

const VARIANT_PRESSED: Record<Variant, string> = {
  primary: "bg-brand-orangeHover",
  secondary: "bg-brand-tealHover",
  ghost: "bg-brand-orangeLight",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-4 py-3 rounded-xl",
  lg: "px-5 py-4 rounded-2xl",
};

const SIZE_TEXT: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={style}
      className={`items-center justify-center ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-40" : ""}`}
    >
      {({ pressed }) => (
        <View
          className={`items-center justify-center ${SIZE_CLASS[size]} ${
            pressed ? VARIANT_PRESSED[variant] : "bg-transparent"
          } ${VARIANT_CLASS[variant]} ${fullWidth ? "w-full" : ""}`}
          style={StyleSheetAbsoluteFill}
        >
          <Text className={`font-poppins font-semibold ${SIZE_TEXT[size]} ${VARIANT_TEXT[variant]}`}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

import { StyleSheet } from "react-native";
const StyleSheetAbsoluteFill = StyleSheet.absoluteFillObject;
```

(Note: the `import` at the bottom is a quirk of the JSX function-as-child pattern. It is intentional; do not refactor.)

- [ ] **Step 4: Create `components/ui/Field.tsx`**

```tsx
import { type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  label: string;
  helper?: string;
  rightAdornment?: ReactNode;
  error?: string;
};

export function Field({ label, helper, rightAdornment, error, ...inputProps }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">{label}</Text>
      <View
        className={`flex-row items-center bg-white border rounded-xl px-3 ${
          error ? "border-red-400" : "border-brand-stoneBorder"
        }`}
      >
        <TextInput
          {...inputProps}
          placeholderTextColor="#a8a29e"
          className="flex-1 py-3 text-base text-brand-stoneDark"
        />
        {rightAdornment}
      </View>
      {helper && !error ? <Text className="text-xs text-stone-500 mt-1.5">{helper}</Text> : null}
      {error ? <Text className="text-xs text-red-500 mt-1.5">{error}</Text> : null}
    </View>
  );
}
```

- [ ] **Step 5: Create `components/ui/StarRating.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, size = 22, readOnly = false }: Props) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <Pressable
            key={i}
            disabled={readOnly}
            onPress={() => onChange?.(i)}
            hitSlop={6}
            className="p-0.5"
          >
            <FontAwesome name={filled ? "star" : "star-o"} size={size} color={filled ? "#f59e0b" : "#a8a29e"} />
          </Pressable>
        );
      })}
      {readOnly ? <Text className="text-xs text-stone-500 ml-2">{value}/5</Text> : null}
    </View>
  );
}
```

- [ ] **Step 6: Create `components/ui/MiniMap.tsx`**

A static decorative map (no `react-native-maps`). Reuses `mapX`/`mapY` percent offsets from each job.

```tsx
import { Text, View } from "react-native";

type Marker = { id: number; x: string; y: string; color?: "orange" | "teal" };

type Props = {
  markers: Marker[];
  height?: number;
  showCompass?: boolean;
};

export function MiniMap({ markers, height = 160, showCompass = true }: Props) {
  return (
    <View
      className="relative rounded-2xl overflow-hidden border border-brand-stoneBorder bg-brand-stoneLight"
      style={{ height }}
    >
      <View className="absolute inset-0 opacity-30">
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={`h${i}`}
            className="absolute left-0 right-0 h-px bg-stone-300"
            style={{ top: `${(i + 1) * 16}%` }}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={`v${i}`}
            className="absolute top-0 bottom-0 w-px bg-stone-300"
            style={{ left: `${(i + 1) * 12}%` }}
          />
        ))}
      </View>
      <View className="absolute top-2 right-2 bg-white/90 rounded-md px-2 py-1">
        <Text className="text-[10px] text-stone-600 font-medium">Bản đồ demo</Text>
      </View>
      {showCompass ? (
        <View className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white items-center justify-center shadow">
          <Text className="text-[10px] font-bold text-stone-600">N</Text>
        </View>
      ) : null}
      {markers.map((m) => (
        <View
          key={m.id}
          className="absolute"
          style={{ left: m.x, top: m.y, transform: [{ translateX: -12 }, { translateY: -24 }] }}
        >
          <View
            className={`w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow ${
              m.color === "teal" ? "bg-brand-teal" : "bg-brand-orange"
            }`}
          >
            <Text className="text-white text-xs font-bold">{m.id % 100}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 7: Re-add `<Toast />` to `app/_layout.tsx` and verify**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add components/ui/Toast.tsx components/ui/Modal.tsx components/ui/Button.tsx components/ui/Field.tsx components/ui/StarRating.tsx components/ui/MiniMap.tsx app/_layout.tsx
git commit -m "feat(ui): add Toast, Modal, Button, Field, StarRating, MiniMap"
```

---

## Phase 4: Auth Flow

### Task 4.1: Welcome screen

**Files:**
- Create: `app/index.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/welcome.tsx`

Implements spec §5.1.

- [ ] **Step 1: Replace `app/index.tsx` to redirect into the auth flow**

```tsx
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/welcome" />;
}
```

- [ ] **Step 2: Create `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Create `app/(auth)/welcome.tsx`**

The hero background uses 3 colored blobs to mimic the HTML's radial gradient effect.

```tsx
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Role } from "@/types";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useGiGood();

  const choose = (role: Role) => {
    dispatch({ type: "SIGNUP_START", role });
    if (role === "seeker") {
      router.push("/login");
    } else {
      router.push("/signup-tasker");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-brand-orangeLight opacity-70" />
      <View className="absolute top-32 -right-24 w-72 h-72 rounded-full bg-brand-tealLight opacity-60" />
      <View className="absolute bottom-40 -left-16 w-60 h-60 rounded-full bg-brand-orangeLight opacity-40" />

      <View className="flex-1 px-7 pt-20" style={{ paddingTop: insets.top + 40 }}>
        <View className="flex-row items-center mb-6">
          <View className="w-12 h-12 rounded-2xl bg-brand-orange items-center justify-center mr-3">
            <FontAwesome name="handshake-o" size={24} color="white" />
          </View>
          <Text className="text-2xl font-poppins font-extrabold text-brand-stoneDark">GiGood</Text>
        </View>

        <Text className="text-3xl font-poppins font-extrabold text-brand-stoneDark leading-tight mb-3">
          Hàng xóm giúp{`\n`}hàng xóm
        </Text>
        <Text className="text-base text-stone-600 leading-relaxed mb-10">
          Nền tảng đăng việc vặt & thuê người làm việc vặt siêu tốc. An toàn, rõ ràng, tiền được giữ ký quỹ đến khi hoàn thành.
        </Text>

        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 bg-brand-orangeLight rounded-2xl p-4 items-center">
            <FontAwesome name="bolt" size={20} color="#ea580c" />
            <Text className="text-xs font-semibold text-brand-orange mt-1.5">Siêu nhanh</Text>
          </View>
          <View className="flex-1 bg-brand-tealLight rounded-2xl p-4 items-center">
            <FontAwesome name="shield" size={20} color="#0f766e" />
            <Text className="text-xs font-semibold text-brand-teal mt-1.5">Ký quỹ an toàn</Text>
          </View>
          <View className="flex-1 bg-brand-orangeLight rounded-2xl p-4 items-center">
            <FontAwesome name="check-circle" size={20} color="#ea580c" />
            <Text className="text-xs font-semibold text-brand-orange mt-1.5">Đánh giá thật</Text>
          </View>
        </View>

        <View className="mt-auto mb-8">
          <Text className="text-sm font-semibold text-stone-700 mb-3 text-center">Bạn muốn đến với GiGood với vai trò nào?</Text>

          <Pressable
            onPress={() => choose("seeker")}
            className="bg-brand-orange rounded-2xl p-4 flex-row items-center mb-3 active:bg-brand-orangeHover"
          >
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
              <FontAwesome name="list-alt" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-poppins font-bold text-base">Tôi cần thuê người</Text>
              <Text className="text-white/80 text-xs mt-0.5">Đăng việc, tìm tasker phù hợp</Text>
            </View>
            <FontAwesome name="arrow-right" size={16} color="white" />
          </Pressable>

          <Pressable
            onPress={() => choose("tasker")}
            className="bg-brand-teal rounded-2xl p-4 flex-row items-center mb-5 active:bg-brand-tealHover"
          >
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
              <FontAwesome name="screwdriver-wrench" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-poppins font-bold text-base">Tôi muốn làm việc</Text>
              <Text className="text-white/80 text-xs mt-0.5">Nhận việc, kiếm thu nhập linh hoạt</Text>
            </View>
            <FontAwesome name="arrow-right" size={16} color="white" />
          </Pressable>

          <View className="flex-row items-center justify-center gap-1.5">
            <Text className="text-stone-500 text-sm">Đã có tài khoản?</Text>
            <Pressable onPress={() => router.push("/login")} hitSlop={8}>
              <Text className="text-brand-orange font-semibold text-sm">Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx "app/(auth)/_layout.tsx" "app/(auth)/welcome.tsx"
git commit -m "feat(auth): add welcome screen with role chooser"
```

---

### Task 4.2: Login + Phone screen

**Files:**
- Create: `app/(auth)/login.tsx`

Implements spec §5.2.

- [ ] **Step 1: Create `app/(auth)/login.tsx`**

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useGiGood } from "@/lib/GiGoodContext";
import { SEEKER_AVATAR } from "@/lib/seed";
import type { UserProfile } from "@/types";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch, state } = useGiGood();
  const [phone, setPhone] = useState("0901234567");
  const [password, setPassword] = useState("••••••••");
  const [showPwd, setShowPwd] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const onSubmit = () => {
    if (!/^0\d{9}$/.test(phone.replace(/\s/g, ""))) {
      setPhoneError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }
    setPhoneError(undefined);
    const profile: UserProfile = {
      name: "Khánh Vy",
      avatar: SEEKER_AVATAR,
      role: state.auth.pendingSignupRole,
      phone,
      location: "Quận 1, TP. Hồ Chí Minh",
      taskerProfile: null,
    };
    dispatch({ type: "LOGIN", profile });
    dispatch({ type: "SHOW_TOAST", message: "Đăng nhập thành công!", variant: "success" });
    if (profile.role === "seeker") {
      router.replace("/(app)/seeker/post");
    } else {
      router.replace("/(app)/tasker/board");
    }
  };

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader title="Đăng nhập" subtitle="Chào mừng bạn quay lại" onBack={() => router.back()} />
      <View className="px-6 pt-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder">
          <Field
            label="Số điện thoại"
            placeholder="VD: 0901234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={phoneError}
          />
          <Field
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={setPassword}
            rightAdornment={
              <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8} className="px-2">
                <FontAwesome name={showPwd ? "eye-slash" : "eye"} size={18} color="#78716c" />
              </Pressable>
            }
          />
          <Pressable className="self-end mb-3">
            <Text className="text-sm text-brand-orange font-medium">Quên mật khẩu?</Text>
          </Pressable>
          <Button onPress={onSubmit} fullWidth size="lg">
            Đăng nhập
          </Button>
        </View>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-brand-stoneBorder" />
          <Text className="text-xs text-stone-500 mx-3">HOẶC</Text>
          <View className="flex-1 h-px bg-brand-stoneBorder" />
        </View>

        <View className="gap-3">
          <Pressable className="bg-white border border-brand-stoneBorder rounded-2xl p-4 flex-row items-center">
            <FontAwesome name="phone" size={18} color="#ea580c" />
            <Text className="ml-3 font-medium text-brand-stoneDark">Tiếp tục với số điện thoại</Text>
          </Pressable>
          <Pressable className="bg-white border border-brand-stoneBorder rounded-2xl p-4 flex-row items-center">
            <FontAwesome name="comment" size={18} color="#0f766e" />
            <Text className="ml-3 font-medium text-brand-stoneDark">Đăng nhập bằng mã OTP</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-stone-500 text-sm">Chưa có tài khoản? </Text>
          <Pressable onPress={() => router.push("/welcome")} hitSlop={8}>
            <Text className="text-brand-orange font-semibold text-sm">Đăng ký ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/login.tsx"
git commit -m "feat(auth): add login screen with phone + password fields"
```

---

### Task 4.3: Tasker signup + role switch

**Files:**
- Create: `app/(auth)/signup-tasker.tsx`
- Create: `components/ui/RoleSwitcher.tsx`
- Modify: `components/ui/ScreenHeader.tsx` (add optional `subtitleClass`)

Implements spec §5.3 (tasker signup with skills/availability/vehicle) and the in-app role switch.

- [ ] **Step 1: Create `components/ui/RoleSwitcher.tsx`**

A reusable segmented control for seeker/tasker toggle in any header.

```tsx
import { Pressable, Text, View } from "react-native";

type Props = {
  value: "seeker" | "tasker";
  onChange: (v: "seeker" | "tasker") => void;
  compact?: boolean;
};

export function RoleSwitcher({ value, onChange, compact = false }: Props) {
  return (
    <View className={`flex-row bg-stone-100 rounded-full p-1 ${compact ? "" : "self-center"}`}>
      {(["seeker", "tasker"] as const).map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            className={`px-4 py-1.5 rounded-full ${active ? (r === "seeker" ? "bg-brand-orange" : "bg-brand-teal") : ""}`}
          >
            <Text className={`text-xs font-semibold ${active ? "text-white" : "text-stone-600"}`}>
              {r === "seeker" ? "Người thuê" : "Người làm"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Patch `ScreenHeader` to accept `subtitleClass`**

In `components/ui/ScreenHeader.tsx`, the prop already exists from Task 3.1. If not present, ensure the type is:

```tsx
type Props = {
  title: string;
  subtitle?: string;
  subtitleClass?: string;
  onBack?: () => void;
  onBell?: () => void;
  showBadge?: boolean;
  accent?: "orange" | "teal";
};
```

(No code change needed; the prop was added in Task 3.1 Step 1. Just verify.)

- [ ] **Step 3: Create `app/(auth)/signup-tasker.tsx`**

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useGiGood } from "@/lib/GiGoodContext";
import { CATEGORY_META, AVAILABILITY_LABEL, VEHICLE_LABEL } from "@/lib/categories";
import { TASKER_AVATAR } from "@/lib/seed";
import type { Availability, Category, UserProfile, Vehicle } from "@/types";

const SKILLS: Category[] = ["repair", "cleaning", "delivery", "helper"];
const AVAILS: Availability[] = ["all-day", "morning", "afternoon", "evening", "weekend"];
const VEHICLES: Vehicle[] = ["motorbike", "car", "bike", "none"];

export default function TaskerSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useGiGood();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Category[]>(["repair"]);
  const [availability, setAvailability] = useState<Availability>("all-day");
  const [vehicle, setVehicle] = useState<Vehicle>("motorbike");

  const toggleSkill = (s: Category) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const canSubmit = name.trim().length >= 2 && /^0\d{9}$/.test(phone.replace(/\s/g, "")) && skills.length > 0;

  const onSubmit = () => {
    if (!canSubmit) return;
    const profile: UserProfile = {
      name: name.trim(),
      avatar: TASKER_AVATAR,
      role: "tasker",
      phone,
      location: "TP. Hồ Chí Minh",
      taskerProfile: { skills, bio, availability, vehicle, verified: true },
    };
    dispatch({ type: "UPDATE_TASKER_PROFILE", skills, bio, availability, vehicle });
    dispatch({ type: "LOGIN", profile });
    dispatch({ type: "SHOW_TOAST", message: `Chào mừng ${profile.name} đến với GiGood!`, variant: "success" });
    router.replace("/(app)/tasker/board");
  };

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title="Hoàn tất hồ sơ"
        subtitle="Hãy cho khách hàng biết về bạn"
        accent="teal"
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Thông tin cơ bản</Text>
          <Field label="Họ và tên" placeholder="VD: Nguyễn Văn A" value={name} onChangeText={setName} />
          <Field
            label="Số điện thoại"
            placeholder="VD: 0901234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Kỹ năng của bạn (chọn ít nhất 1)</Text>
          <View className="flex-row flex-wrap gap-2">
            {SKILLS.map((s) => {
              const meta = CATEGORY_META[s];
              const active = skills.includes(s);
              return (
                <Pressable
                  key={s}
                  onPress={() => toggleSkill(s)}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${
                    active
                      ? meta.accent === "orange"
                        ? "bg-brand-orange border-brand-orange"
                        : "bg-brand-teal border-brand-teal"
                      : "bg-white border-brand-stoneBorder"
                  }`}
                >
                  <FontAwesome
                    name={meta.icon}
                    size={14}
                    color={active ? "white" : meta.accent === "orange" ? "#ea580c" : "#0f766e"}
                  />
                  <Text
                    className={`ml-1.5 text-sm font-medium ${
                      active ? "text-white" : "text-brand-stoneDark"
                    }`}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Thời gian có thể làm việc</Text>
          <View className="gap-2">
            {AVAILS.map((a) => {
              const active = a === availability;
              return (
                <Pressable
                  key={a}
                  onPress={() => setAvailability(a)}
                  className={`flex-row items-center px-3 py-3 rounded-xl border ${
                    active ? "bg-brand-tealLight border-brand-teal" : "bg-white border-brand-stoneBorder"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      active ? "border-brand-teal" : "border-stone-300"
                    }`}
                  >
                    {active ? <View className="w-2.5 h-2.5 rounded-full bg-brand-teal" /> : null}
                  </View>
                  <Text className={`text-sm ${active ? "text-brand-teal font-semibold" : "text-stone-700"}`}>
                    {AVAILABILITY_LABEL[a]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Phương tiện di chuyển</Text>
          <View className="flex-row flex-wrap gap-2">
            {VEHICLES.map((v) => {
              const active = v === vehicle;
              return (
                <Pressable
                  key={v}
                  onPress={() => setVehicle(v)}
                  className={`px-3 py-2 rounded-full border ${
                    active ? "bg-brand-teal border-brand-teal" : "bg-white border-brand-stoneBorder"
                  }`}
                >
                  <Text className={`text-sm font-medium ${active ? "text-white" : "text-brand-stoneDark"}`}>
                    {VEHICLE_LABEL[v]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-6">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Giới thiệu ngắn (tùy chọn)</Text>
          <Field
            label=""
            placeholder="VD: Tôi có 5 năm kinh nghiệm sửa điện nước tại nhà..."
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
          />
        </View>

        <Button onPress={onSubmit} fullWidth size="lg" disabled={!canSubmit} variant="secondary">
          Hoàn tất đăng ký
        </Button>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/signup-tasker.tsx" components/ui/RoleSwitcher.tsx
git commit -m "feat(auth): add tasker signup with skills/availability/vehicle"
```

---

## Phase 5: App Shell & Seeker Screens

### Task 5.1: App group layout + notifications modal

**Files:**
- Create: `app/(app)/_layout.tsx`
- Create: `app/(app)/seeker/_layout.tsx`
- Create: `app/(app)/tasker/_layout.tsx`
- Create: `components/ui/NotificationsPanel.tsx`

Implements spec §6.1 (notifications modal) and the app shell that hosts the bottom tabs.

- [ ] **Step 1: Create `app/(app)/_layout.tsx`**

The app shell renders the correct bottom tabs based on `state.auth.currentRole` and provides a single overlay `<NotificationsPanel />`.

```tsx
import { Slot } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabs } from "@/components/ui/BottomTabs";
import { NotificationsPanel } from "@/components/ui/NotificationsPanel";
import { useGiGood } from "@/lib/GiGoodContext";

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGiGood();
  const role = state.auth.currentRole;

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <View className="flex-1" style={{ paddingBottom: 76 + insets.bottom }}>
        <Slot />
      </View>
      <BottomTabs
        role={role}
        active={role === "seeker" ? state.ui.activeSeekerSubTab : state.ui.activeTaskerSubTab}
        onChange={(t) => {
          if (role === "seeker") {
            dispatch({ type: "SET_SEEKER_SUBTAB", tab: t as never });
          } else {
            dispatch({ type: "SET_TASKER_SUBTAB", tab: t as never });
          }
        }}
      />
      <NotificationsPanel />
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(app)/seeker/_layout.tsx`**

```tsx
import { Stack } from "expo-router";

export default function SeekerLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Create `app/(app)/tasker/_layout.tsx`**

```tsx
import { Stack } from "expo-router";

export default function TaskerLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 4: Create `components/ui/NotificationsPanel.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Animated, { FadeInRight, FadeOutRight } from "react-native-reanimated";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationsPanel() {
  const { list, open, close, markRead, clear } = useNotifications();
  const router = useRouter();

  return (
    <>
      <View className="absolute top-12 right-4 z-40">
        <Pressable
          onPress={open}
          className="w-10 h-10 rounded-full bg-white border border-brand-stoneBorder items-center justify-center"
          hitSlop={6}
        >
          <FontAwesome name="bell" size={18} color="#1c1917" />
        </Pressable>
      </View>

      {list ? null : null}
      {open ? null : null}
    </>
  );
}
```

(Stub for now; we wire the real animation in the next step.)

- [ ] **Step 5: Replace the NotificationsPanel body with a real sliding panel**

Reopen `components/ui/NotificationsPanel.tsx` and replace the entire export with:

```tsx
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";
import { useNotifications } from "@/hooks/useNotifications";
import { useGiGood } from "@/lib/GiGoodContext";

export function NotificationsPanel() {
  const { state, dispatch } = useGiGood();
  const { list, close, markRead, clear } = useNotifications();
  const isOpen = state.ui.notifOpen;

  return (
    <>
      <View className="absolute top-12 right-4 z-40">
        <Pressable
          onPress={() => dispatch({ type: "OPEN_NOTIFS" })}
          className="w-10 h-10 rounded-full bg-white border border-brand-stoneBorder items-center justify-center relative"
          hitSlop={6}
        >
          <FontAwesome name="bell" size={18} color="#1c1917" />
          {state.ui.notifBadge ? (
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-orange items-center justify-center">
              <Text className="text-white text-[9px] font-bold">{list.filter((n) => !n.read).length || "•"}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isOpen ? (
        <View className="absolute inset-0 z-50" pointerEvents="box-none">
          <Pressable onPress={close} className="absolute inset-0 bg-black/30" />
          <Animated.View
            entering={SlideInRight.duration(220)}
            exiting={SlideOutRight.duration(180)}
            className="absolute top-0 right-0 bottom-0 w-[88%] bg-white pt-12 px-5"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-poppins font-bold text-brand-stoneDark">Thông báo</Text>
              <Pressable onPress={close} hitSlop={8}>
                <FontAwesome name="times" size={20} color="#1c1917" />
              </Pressable>
            </View>
            <View className="flex-row gap-2 mb-3">
              <Pressable
                onPress={markRead}
                className="px-3 py-1.5 rounded-full bg-brand-orangeLight"
                hitSlop={4}
              >
                <Text className="text-xs font-semibold text-brand-orange">Đánh dấu đã đọc</Text>
              </Pressable>
              <Pressable onPress={clear} className="px-3 py-1.5 rounded-full bg-stone-100" hitSlop={4}>
                <Text className="text-xs font-semibold text-stone-600">Xóa tất cả</Text>
              </Pressable>
            </View>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
              {list.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <FontAwesome name="bell" size={32} color="#a8a29e" />
                  <Text className="text-stone-500 text-sm mt-3">Chưa có thông báo nào</Text>
                </View>
              ) : (
                list.map((n) => (
                  <View
                    key={n.id}
                    className={`p-3 rounded-xl mb-2 border ${
                      n.read ? "bg-white border-brand-stoneBorder" : "bg-brand-orangeLight border-brand-orange/30"
                    }`}
                  >
                    <Text className="text-sm text-brand-stoneDark">{n.text}</Text>
                    <Text className="text-[11px] text-stone-500 mt-1">{n.time}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}
```

- [ ] **Step 6: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/_layout.tsx" "app/(app)/seeker/_layout.tsx" "app/(app)/tasker/_layout.tsx" components/ui/NotificationsPanel.tsx
git commit -m "feat(app): add app shell, sub-layouts, and notifications panel"
```

---

### Task 5.2: Seeker post-job screen

**Files:**
- Create: `app/(app)/seeker/post.tsx`
- Create: `app/(app)/seeker/index.tsx` (redirect → post)

Implements spec §6.2 (post tab with form + map preview + "Tìm tasker gần bạn" button).

- [ ] **Step 1: Create `app/(app)/seeker/index.tsx`**

```tsx
import { Redirect } from "expo-router";

export default function SeekerIndex() {
  return <Redirect href="/(app)/seeker/post" />;
}
```

- [ ] **Step 2: Create `app/(app)/seeker/post.tsx`**

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { MiniMap } from "@/components/ui/MiniMap";
import { useSeeker } from "@/hooks/useSeeker";
import { useJobs } from "@/hooks/useJobs";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";
import type { Category } from "@/types";

const CATEGORIES: Category[] = ["repair", "cleaning", "delivery", "helper"];

export default function SeekerPostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, wallet, showToast } = useSeeker();
  const { postJob, jobs } = useJobs();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("repair");
  const [budget, setBudget] = useState("150000");
  const [location, setLocation] = useState("Quận 1, TP. Hồ Chí Minh");
  const [matching, setMatching] = useState(false);

  const myJobOnMap = jobs.find((j) => j.seekerName === profile?.name && j.status !== "completed");

  const onSubmit = () => {
    if (!profile) return;
    if (title.trim().length < 5) {
      showToast("Tiêu đề quá ngắn, vui lòng nhập ít nhất 5 ký tự", "error");
      return;
    }
    const budgetNum = Number(budget.replace(/\D/g, ""));
    if (!Number.isFinite(budgetNum) || budgetNum < 10_000) {
      showToast("Ngân sách tối thiểu 10.000 VND", "error");
      return;
    }
    const job = postJob({
      title: title.trim(),
      category,
      budget: budgetNum,
      location: location.trim(),
      description: description.trim() || "Không có mô tả chi tiết.",
      timeTag: "Vừa xong",
      seekerName: profile.name,
      mapX: "20%",
      mapY: "50%",
    });
    setTitle("");
    setDescription("");
    setBudget("150000");
    showToast("Đã đăng việc! Đang tìm tasker...", "success");
    setMatching(true);
    setTimeout(() => {
      setMatching(false);
      router.push(`/(app)/seeker/chat/${job.id}`);
    }, 1800);
  };

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title={`Chào ${profile?.name ?? "bạn"}`}
        subtitle="Đăng việc vặt dễ dàng"
        accent="orange"
        onBell
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-brand-orangeLight rounded-2xl p-4 mb-4 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-brand-orange items-center justify-center">
            <FontAwesome name="money" size={16} color="white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs text-brand-orange font-medium">Ví của bạn</Text>
            <Text className="text-lg font-poppins font-bold text-brand-stoneDark">{formatVND(wallet)}</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Loại việc vặt</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c];
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${
                    active
                      ? meta.accent === "orange"
                        ? "bg-brand-orange border-brand-orange"
                        : "bg-brand-teal border-brand-teal"
                      : "bg-white border-brand-stoneBorder"
                  }`}
                >
                  <FontAwesome
                    name={meta.icon}
                    size={14}
                    color={active ? "white" : meta.accent === "orange" ? "#ea580c" : "#0f766e"}
                  />
                  <Text
                    className={`ml-1.5 text-sm font-medium ${
                      active ? "text-white" : "text-brand-stoneDark"
                    }`}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
          <Field
            label="Tiêu đề công việc"
            placeholder="VD: Thông tắc bồn rửa bát"
            value={title}
            onChangeText={setTitle}
          />
          <Field
            label="Mô tả chi tiết"
            placeholder="Mô tả càng rõ càng có nhiều tasker nhận..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <Field
            label="Ngân sách dự kiến (VND)"
            placeholder="VD: 150000"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
            helper="Tiền sẽ được giữ ký quỹ an toàn đến khi hoàn thành"
          />
          <Field
            label="Địa điểm"
            placeholder="Số nhà, đường, phường/quận"
            value={location}
            onChangeText={setLocation}
            rightAdornment={
              <Pressable className="px-2" hitSlop={6}>
                <FontAwesome name="map-marker" size={18} color="#ea580c" />
              </Pressable>
            }
          />
        </View>

        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1">Bản đồ khu vực</Text>
        <MiniMap
          height={160}
          markers={
            myJobOnMap
              ? [
                  { id: myJobOnMap.id, x: myJobOnMap.mapX, y: myJobOnMap.mapY, color: "orange" },
                ]
              : []
          }
        />

        <View className="h-4" />

        <Button onPress={onSubmit} fullWidth size="lg" disabled={matching}>
          {matching ? "Đang tìm tasker..." : "Tìm tasker gần bạn"}
        </Button>
        {matching ? (
          <Text className="text-center text-xs text-stone-500 mt-2">
            Hệ thống đang tìm tasker phù hợp quanh khu vực của bạn...
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/seeker/index.tsx" "app/(app)/seeker/post.tsx"
git commit -m "feat(seeker): add post-job screen with category/budget/map"
```

---

### Task 5.3: Seeker jobs list screen

**Files:**
- Create: `app/(app)/seeker/jobs.tsx`

Implements spec §6.3 (jobs tab with my-posted jobs grouped by status).

- [ ] **Step 1: Create `app/(app)/seeker/jobs.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { useSeeker } from "@/hooks/useSeeker";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function SeekerJobsScreen() {
  const router = useRouter();
  const { myJobs } = useSeeker();

  const active = myJobs.filter((j) => j.status !== "completed");
  const completed = myJobs.filter((j) => j.status === "completed");

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader title="Việc của tôi" subtitle={`${active.length} đang chạy, ${completed.length} đã xong`} onBell />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1">Đang chạy</Text>
        {active.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder mb-4">
            <FontAwesome name="list-alt" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Bạn chưa đăng việc nào</Text>
          </View>
        ) : (
          active.map((job) => {
            const meta = CATEGORY_META[job.category];
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(app)/seeker/chat/${job.id}`)}
                className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder active:bg-stone-50"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                      meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
                    }`}
                  >
                    <FontAwesome
                      name={meta.icon}
                      size={16}
                      color={meta.accent === "orange" ? "#ea580c" : "#0f766e"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text className="text-xs text-stone-500 mt-0.5">{job.timeTag}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#a8a29e" />
                </View>
                <View className="flex-row items-center justify-between mt-1">
                  <StatusPill status={job.status} />
                  <Text className="text-sm font-poppins font-bold text-brand-stoneDark">
                    {formatVND(job.budget)}
                  </Text>
                </View>
                {job.taskerName ? (
                  <View className="flex-row items-center mt-3 pt-3 border-t border-brand-stoneBorder">
                    <FontAwesome name="user" size={12} color="#0f766e" />
                    <Text className="text-xs text-brand-teal ml-1.5 font-medium">
                      Tasker: {job.taskerName}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}

        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1 mt-2">Đã hoàn thành</Text>
        {completed.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="check-circle" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có công việc hoàn thành</Text>
          </View>
        ) : (
          completed.map((job) => (
            <Pressable
              key={job.id}
              onPress={() => router.push(`/(app)/seeker/chat/${job.id}`)}
              className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder active:bg-stone-50"
            >
              <View className="flex-row items-center mb-1">
                <View className="flex-1">
                  <Text className="text-base font-poppins font-semibold text-stone-500" numberOfLines={1}>
                    {job.title}
                  </Text>
                  <Text className="text-xs text-stone-500 mt-0.5">Hoàn thành {job.timeTag}</Text>
                </View>
                <Text className="text-sm font-poppins font-bold text-stone-500">{formatVND(job.budget)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/seeker/jobs.tsx"
git commit -m "feat(seeker): add jobs list with active and completed sections"
```

---

### Task 5.4: Seeker chat list, chat detail, history, escrow & rating modals

**Files:**
- Create: `app/(app)/seeker/chat/index.tsx`
- Create: `app/(app)/seeker/chat/[jobId].tsx`
- Create: `app/(app)/seeker/history.tsx`
- Create: `app/(app)/seeker/_components/ReleaseEscrowModal.tsx`
- Create: `app/(app)/seeker/_components/SeekerRateModal.tsx`
- Create: `app/(app)/seeker/_components/CompletionConfirmationModal.tsx`

Implements spec §6.4 (chat list), §6.5 (chat detail with messages + escrow release + rate), §6.6 (history with completed jobs), and the three modals.

- [ ] **Step 1: Create `app/(app)/seeker/chat/index.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useSeeker } from "@/hooks/useSeeker";
import { CATEGORY_META } from "@/lib/categories";

export default function SeekerChatList() {
  const router = useRouter();
  const { myJobs } = useSeeker();
  const active = myJobs.filter((j) => j.status === "assigned");

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader title="Tin nhắn" subtitle={`${active.length} cuộc hội thoại`} onBell />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {active.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="comment" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có cuộc hội thoại nào</Text>
          </View>
        ) : (
          active.map((job) => {
            const last = job.chats[job.chats.length - 1];
            const meta = CATEGORY_META[job.category];
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(app)/seeker/chat/${job.id}`)}
                className="bg-white rounded-2xl p-3 mb-3 border border-brand-stoneBorder flex-row items-center active:bg-stone-50"
              >
                <Avatar uri="https://placehold.co/100x100/0f766e/ffffff?text=QT" name={job.taskerName ?? "?"} size={48} />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                      {job.taskerName ?? "Đang tìm tasker..."}
                    </Text>
                    <Text className="text-[11px] text-stone-500">{last?.time ?? job.timeTag}</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <FontAwesome
                      name={meta.icon}
                      size={11}
                      color={meta.accent === "orange" ? "#ea580c" : "#0f766e"}
                    />
                    <Text className="text-xs text-stone-500 ml-1.5" numberOfLines={1}>
                      {job.title}
                    </Text>
                  </View>
                  {last ? (
                    <Text className="text-xs text-stone-600 mt-1" numberOfLines={1}>
                      {last.sender === "seeker" ? "Bạn: " : ""}
                      {last.text}
                    </Text>
                  ) : null}
                </View>
                <FontAwesome name="chevron-right" size={14} color="#a8a29e" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(app)/seeker/chat/[jobId].tsx`**

```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarRating } from "@/components/ui/StarRating";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import { useSeeker } from "@/hooks/useSeeker";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function SeekerChatDetail() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGiGood();
  const { findById, sendMessage, reportCompletion, rateJob } = useJobs();
  const { showToast } = useSeeker();
  const id = jobId ? Number(jobId) : null;
  const job = findById(id);
  const [text, setText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const seekerName = state.auth.profile?.name ?? "Bạn";

  if (!job) {
    return (
      <View className="flex-1 bg-brand-stoneLight">
        <ScreenHeader title="Không tìm thấy" onBack={() => router.back()} />
      </View>
    );
  }

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(job.id, { sender: "seeker", text: t, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) });
    setText("");
    setTimeout(() => {
      sendMessage(job.id, { sender: "tasker", text: "Cảm ơn bạn, mình sẽ xử lý ngay nhé!", time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) });
    }, 1200);
  };

  const onConfirmComplete = () => {
    reportCompletion(job.id, "seeker");
    setShowConfirm(false);
    showToast("Đã xác nhận hoàn thành, vui lòng đánh giá tasker", "success");
    setShowRate(true);
  };

  const onSubmitRating = () => {
    rateJob(job.id, "seeker", rating);
    setShowRate(false);
    setReview("");
    showToast("Cảm ơn bạn đã đánh giá!", "success");
  };

  const meta = CATEGORY_META[job.category];

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title={job.taskerName ?? "Đang tìm tasker"}
        subtitle={meta.label}
        accent="orange"
        onBack={() => router.back()}
      />

      <View className="flex-1" style={{ paddingBottom: 64 + insets.bottom }}>
        <View className="bg-white border-b border-brand-stoneBorder p-3 flex-row items-center">
          <Avatar
            uri="https://placehold.co/100x100/0f766e/ffffff?text=QT"
            name={job.taskerName ?? "?"}
            size={42}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-poppins font-semibold text-brand-stoneDark">{job.taskerName}</Text>
            <Text className="text-[11px] text-brand-teal font-medium">● Đang trực tuyến</Text>
          </View>
          <Pressable className="w-9 h-9 items-center justify-center" hitSlop={6}>
            <FontAwesome name="phone" size={18} color="#ea580c" />
          </Pressable>
        </View>

        <View className="bg-white px-4 py-3 border-b border-brand-stoneBorder">
          <View className="flex-row items-center">
            <View
              className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
              }`}
            >
              <FontAwesome name={meta.icon} size={14} color={meta.accent === "orange" ? "#ea580c" : "#0f766e"} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                {job.title}
              </Text>
              <Text className="text-xs text-stone-500 mt-0.5" numberOfLines={1}>
                {job.location}
              </Text>
            </View>
            <Text className="text-sm font-poppins font-bold text-brand-stoneDark">{formatVND(job.budget)}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="items-center my-3">
            <Text className="text-[11px] text-stone-500 bg-stone-200 px-3 py-1 rounded-full">
              {job.timeTag} · Ký quỹ {formatVND(job.budget)}
            </Text>
          </View>
          {job.chats.map((m, i) => {
            const mine = m.sender === "seeker";
            return (
              <View key={i} className={`mb-2 max-w-[80%] ${mine ? "self-end" : "self-start"}`}>
                <View
                  className={`px-3 py-2 rounded-2xl ${
                    mine ? "bg-brand-orange rounded-tr-sm" : "bg-white border border-brand-stoneBorder rounded-tl-sm"
                  }`}
                >
                  <Text className={`text-sm ${mine ? "text-white" : "text-brand-stoneDark"}`}>{m.text}</Text>
                </View>
                <Text className={`text-[10px] text-stone-500 mt-0.5 ${mine ? "text-right" : ""}`}>{m.time}</Text>
              </View>
            );
          })}

          {job.status === "completed" ? (
            <View className="mt-4 bg-brand-tealLight rounded-2xl p-4 items-center">
              <FontAwesome name="check-circle" size={28} color="#0f766e" />
              <Text className="text-brand-teal font-poppins font-bold text-base mt-2">Công việc đã hoàn thành</Text>
              <Text className="text-xs text-stone-600 mt-1 text-center">
                Cảm ơn bạn đã sử dụng GiGood. Vui lòng đánh giá trải nghiệm.
              </Text>
              {job.seekerRating == null ? (
                <Button variant="secondary" size="md" onPress={() => setShowRate(true)}>
                  Đánh giá ngay
                </Button>
              ) : (
                <View className="mt-2">
                  <StarRating value={job.seekerRating} readOnly size={18} />
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        {job.status === "assigned" ? (
          <View className="absolute left-0 right-0 px-4" style={{ bottom: 80 + insets.bottom }}>
            <Button
              onPress={() => setShowConfirm(true)}
              fullWidth
              size="md"
              variant="secondary"
            >
              Xác nhận hoàn thành & giải ngân
            </Button>
          </View>
        ) : null}

        <View
          className="absolute left-0 right-0 bg-white border-t border-brand-stoneBorder px-3 py-2 flex-row items-center"
          style={{ bottom: 0, paddingBottom: insets.bottom + 8 }}
        >
          <Pressable className="w-9 h-9 items-center justify-center mr-1" hitSlop={6}>
            <FontAwesome name="paper-plane" size={18} color="#ea580c" />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#a8a29e"
            className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm text-brand-stoneDark"
            multiline
          />
          <Pressable onPress={send} className="ml-2 w-9 h-9 rounded-full bg-brand-orange items-center justify-center" hitSlop={6}>
            <FontAwesome name="paper-plane" size={14} color="white" />
          </Pressable>
        </View>
      </View>

      <Modal visible={showConfirm} onClose={() => setShowConfirm(false)} title="Xác nhận hoàn thành">
        <View className="items-center mb-3">
          <View className="w-14 h-14 rounded-full bg-brand-tealLight items-center justify-center">
            <FontAwesome name="check-circle" size={28} color="#0f766e" />
          </View>
        </View>
        <Text className="text-center text-sm text-stone-700 leading-relaxed mb-4">
          Sau khi xác nhận, {formatVND(job.budget)} sẽ được giải ngân từ ký quỹ cho tasker. Bạn có thể đánh giá ngay sau đó.
        </Text>
        <View className="flex-row gap-3">
          <Button variant="ghost" onPress={() => setShowConfirm(false)} style={{ flex: 1 }}>
            Huỷ
          </Button>
          <Button variant="secondary" onPress={onConfirmComplete} style={{ flex: 1 }}>
            Xác nhận
          </Button>
        </View>
      </Modal>

      <Modal visible={showRate} onClose={() => setShowRate(false)} title="Đánh giá tasker">
        <View className="items-center mb-4">
          <Avatar uri="https://placehold.co/100x100/0f766e/ffffff?text=QT" name={job.taskerName ?? "?"} size={64} />
          <Text className="font-poppins font-bold text-base mt-2 text-brand-stoneDark">{job.taskerName}</Text>
          <Text className="text-xs text-stone-500 mt-0.5">{seekerName} đánh giá tasker này</Text>
        </View>
        <View className="items-center mb-4">
          <StarRating value={rating} onChange={setRating} size={32} />
        </View>
        <Field
          label="Nhận xét của bạn (tuỳ chọn)"
          placeholder="VD: Tasker làm việc rất có trách nhiệm..."
          multiline
          numberOfLines={3}
          value={review}
          onChangeText={setReview}
        />
        <Button variant="primary" fullWidth onPress={onSubmitRating}>
          Gửi đánh giá
        </Button>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 3: Create `app/(app)/seeker/history.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarRating } from "@/components/ui/StarRating";
import { useSeeker } from "@/hooks/useSeeker";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function SeekerHistoryScreen() {
  const router = useRouter();
  const { myJobs } = useSeeker();
  const completed = myJobs.filter((j) => j.status === "completed");

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader title="Lịch sử" subtitle={`${completed.length} công việc đã hoàn thành`} onBell />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {completed.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="history" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có lịch sử công việc</Text>
          </View>
        ) : (
          completed.map((job) => {
            const meta = CATEGORY_META[job.category];
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(app)/seeker/chat/${job.id}`)}
                className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                      meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
                    }`}
                  >
                    <FontAwesome name={meta.icon} size={14} color={meta.accent === "orange" ? "#ea580c" : "#0f766e"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text className="text-[11px] text-stone-500 mt-0.5">Hoàn thành {job.timeTag}</Text>
                  </View>
                  <Text className="text-sm font-poppins font-bold text-brand-stoneDark">{formatVND(job.budget)}</Text>
                </View>
                <View className="flex-row items-center justify-between pt-3 border-t border-brand-stoneBorder">
                  <View className="flex-row items-center">
                    <FontAwesome name="user" size={12} color="#0f766e" />
                    <Text className="text-xs text-brand-teal ml-1.5 font-medium">{job.taskerName}</Text>
                  </View>
                  {job.seekerRating != null ? <StarRating value={job.seekerRating} readOnly size={14} /> : null}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/seeker/chat/" "app/(app)/seeker/history.tsx"
git commit -m "feat(seeker): add chat list, chat detail, history, escrow & rate modals"
```

---

## Phase 6: Tasker Screens

### Task 6.1: Tasker board (job marketplace with mini-map)

**Files:**
- Create: `app/(app)/tasker/index.tsx`
- Create: `app/(app)/tasker/board.tsx`
- Create: `app/(app)/tasker/_components/AcceptJobModal.tsx`

Implements spec §7.1 (board with map + nearby jobs + accept modal).

- [ ] **Step 1: Create `app/(app)/tasker/index.tsx`**

```tsx
import { Redirect } from "expo-router";

export default function TaskerIndex() {
  return <Redirect href="/(app)/tasker/board" />;
}
```

- [ ] **Step 2: Create `app/(app)/tasker/board.tsx`**

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MiniMap } from "@/components/ui/MiniMap";
import { Modal } from "@/components/ui/Modal";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTasker } from "@/hooks/useTasker";
import { useJobs } from "@/hooks/useJobs";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Job } from "@/types";

export default function TaskerBoardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openJobs, showToast, escrowPool, profile } = useTasker();
  const { acceptJob } = useJobs();
  const { state } = useGiGood();
  const [filter, setFilter] = useState<"all" | "near" | "high">("all");
  const [pendingJob, setPendingJob] = useState<Job | null>(null);

  const filtered = openJobs.filter((j) => {
    if (filter === "high") return j.budget >= 100_000;
    return true;
  });

  const onAccept = () => {
    if (!pendingJob || !profile) return;
    acceptJob(pendingJob.id, profile.name);
    showToast(`Bạn đã nhận việc #${pendingJob.id}. Chúc bạn làm việc hiệu quả!`, "success");
    setPendingJob(null);
    router.push(`/(app)/tasker/active/${pendingJob.id}`);
  };

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title={`Chào ${profile?.name ?? "bạn"}`}
        subtitle={`${openJobs.length} việc đang chờ gần bạn`}
        accent="teal"
        onBell
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="bg-brand-tealLight rounded-2xl p-4 mb-4 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-brand-teal items-center justify-center">
            <FontAwesome name="money" size={16} color="white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs text-brand-teal font-medium">Ví của bạn</Text>
            <Text className="text-lg font-poppins font-bold text-brand-stoneDark">
              {formatVND(0)}
            </Text>
            <Text className="text-[11px] text-stone-500 mt-0.5">Ký quỹ chờ giải ngân: {formatVND(escrowPool)}</Text>
          </View>
        </View>

        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1">Bản đồ việc làm</Text>
        <MiniMap
          markers={openJobs.map((j) => ({ id: j.id, x: j.mapX, y: j.mapY, color: "teal" as const }))}
        />

        <View className="flex-row gap-2 mt-4 mb-2">
          {([
            { k: "all", label: "Tất cả" },
            { k: "near", label: "Gần tôi" },
            { k: "high", label: "Thu nhập cao" },
          ] as const).map((f) => {
            const active = f.k === filter;
            return (
              <Pressable
                key={f.k}
                onPress={() => setFilter(f.k)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? "bg-brand-teal border-brand-teal" : "bg-white border-brand-stoneBorder"
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-stone-700"}`}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1">
          Việc đang chờ ({filtered.length})
        </Text>
        {filtered.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="briefcase" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có việc nào phù hợp</Text>
          </View>
        ) : (
          filtered.map((job) => {
            const meta = CATEGORY_META[job.category];
            return (
              <View key={job.id} className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder">
                <View className="flex-row items-center mb-2">
                  <View
                    className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                      meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
                    }`}
                  >
                    <FontAwesome name={meta.icon} size={14} color={meta.accent === "orange" ? "#ea580c" : "#0f766e"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={2}>
                      {job.title}
                    </Text>
                    <Text className="text-[11px] text-stone-500 mt-0.5">{job.location}</Text>
                  </View>
                </View>
                <Text className="text-xs text-stone-600 mb-2" numberOfLines={2}>
                  {job.description}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-poppins font-bold text-brand-teal">{formatVND(job.budget)}</Text>
                  <Button variant="secondary" size="sm" onPress={() => setPendingJob(job)}>
                    Nhận việc
                  </Button>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!pendingJob} onClose={() => setPendingJob(null)} title="Xác nhận nhận việc">
        {pendingJob ? (
          <View>
            <View className="items-center mb-3">
              <Avatar uri="https://placehold.co/100x100/ea580c/ffffff?text=KV" name={pendingJob.seekerName} size={56} />
              <Text className="font-poppins font-bold text-base mt-2 text-brand-stoneDark">{pendingJob.seekerName}</Text>
            </View>
            <Text className="text-sm text-brand-stoneDark font-semibold">{pendingJob.title}</Text>
            <Text className="text-xs text-stone-500 mt-1">{pendingJob.location}</Text>
            <View className="bg-brand-tealLight rounded-xl p-3 my-3 flex-row items-center">
              <FontAwesome name="shield" size={16} color="#0f766e" />
              <Text className="text-xs text-brand-teal ml-2 flex-1">
                {formatVND(pendingJob.budget)} sẽ được ký quỹ an toàn cho bạn
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Button variant="ghost" onPress={() => setPendingJob(null)} style={{ flex: 1 }}>
                Để sau
              </Button>
              <Button variant="secondary" onPress={onAccept} style={{ flex: 1 }}>
                Nhận việc
              </Button>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/tasker/index.tsx" "app/(app)/tasker/board.tsx"
git commit -m "feat(tasker): add board screen with map, filters, and accept modal"
```

---

### Task 6.2: Tasker active jobs + chat detail + earnings

**Files:**
- Create: `app/(app)/tasker/active.tsx`
- Create: `app/(app)/tasker/chat/index.tsx`
- Create: `app/(app)/tasker/chat/[jobId].tsx`
- Create: `app/(app)/tasker/earnings.tsx`
- Create: `app/(app)/tasker/_components/ReportCompletionModal.tsx`

Implements spec §7.2 (active list), §7.3 (chat with completion report), §7.4 (earnings with chart).

- [ ] **Step 1: Create `app/(app)/tasker/active.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { useTasker } from "@/hooks/useTasker";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function TaskerActiveScreen() {
  const router = useRouter();
  const { myActiveJobs } = useTasker();

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title="Đang làm"
        subtitle={`${myActiveJobs.length} công việc`}
        accent="teal"
        onBell
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {myActiveJobs.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="bolt" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Bạn chưa nhận việc nào</Text>
            <Text className="text-xs text-stone-400 mt-1">Hãy vào Bảng tin để tìm việc phù hợp</Text>
          </View>
        ) : (
          myActiveJobs.map((job) => {
            const meta = CATEGORY_META[job.category];
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(app)/tasker/chat/${job.id}`)}
                className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                      meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
                    }`}
                  >
                    <FontAwesome name={meta.icon} size={14} color={meta.accent === "orange" ? "#ea580c" : "#0f766e"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text className="text-[11px] text-stone-500 mt-0.5">{job.timeTag}</Text>
                  </View>
                </View>
                <View className="flex-row items-center mb-2">
                  <Avatar uri="https://placehold.co/100x100/ea580c/ffffff?text=KV" name={job.seekerName} size={28} />
                  <Text className="ml-2 text-xs text-stone-600">Khách: <Text className="font-semibold">{job.seekerName}</Text></Text>
                </View>
                <View className="flex-row items-center justify-between pt-2 border-t border-brand-stoneBorder">
                  <StatusPill status={job.status} />
                  <Text className="text-sm font-poppins font-bold text-brand-stoneDark">{formatVND(job.budget)}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(app)/tasker/chat/index.tsx`**

```tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTasker } from "@/hooks/useTasker";
import { CATEGORY_META } from "@/lib/categories";

export default function TaskerChatList() {
  const router = useRouter();
  const { myActiveJobs } = useTasker();
  const items = myActiveJobs;

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader title="Tin nhắn" subtitle={`${items.length} cuộc hội thoại`} accent="teal" onBell />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {items.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="comment" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có cuộc hội thoại nào</Text>
          </View>
        ) : (
          items.map((job) => {
            const last = job.chats[job.chats.length - 1];
            const meta = CATEGORY_META[job.category];
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(app)/tasker/chat/${job.id}`)}
                className="bg-white rounded-2xl p-3 mb-3 border border-brand-stoneBorder flex-row items-center active:bg-stone-50"
              >
                <Avatar uri="https://placehold.co/100x100/ea580c/ffffff?text=KV" name={job.seekerName} size={48} />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                      {job.seekerName}
                    </Text>
                    <Text className="text-[11px] text-stone-500">{last?.time ?? job.timeTag}</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <FontAwesome
                      name={meta.icon}
                      size={11}
                      color={meta.accent === "orange" ? "#ea580c" : "#0f766e"}
                    />
                    <Text className="text-xs text-stone-500 ml-1.5" numberOfLines={1}>
                      {job.title}
                    </Text>
                  </View>
                  {last ? (
                    <Text className="text-xs text-stone-600 mt-1" numberOfLines={1}>
                      {last.sender === "tasker" ? "Bạn: " : ""}
                      {last.text}
                    </Text>
                  ) : null}
                </View>
                <FontAwesome name="chevron-right" size={14} color="#a8a29e" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 3: Create `app/(app)/tasker/chat/[jobId].tsx`**

```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarRating } from "@/components/ui/StarRating";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import { useTasker } from "@/hooks/useTasker";
import { CATEGORY_META } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function TaskerChatDetail() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGiGood();
  const { findById, sendMessage, reportCompletion, rateJob } = useJobs();
  const { showToast } = useTasker();
  const id = jobId ? Number(jobId) : null;
  const job = findById(id);
  const [text, setText] = useState("");
  const [showReport, setShowReport] = useState(false);

  if (!job) {
    return (
      <View className="flex-1 bg-brand-stoneLight">
        <ScreenHeader title="Không tìm thấy" onBack={() => router.back()} />
      </View>
    );
  }

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(job.id, { sender: "tasker", text: t, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) });
    setText("");
  };

  const onReportComplete = () => {
    reportCompletion(job.id, "tasker");
    setShowReport(false);
    showToast("Đã báo cáo hoàn thành, chờ khách hàng xác nhận", "info");
  };

  const meta = CATEGORY_META[job.category];
  const seekerAlreadyRated = job.seekerRating != null;
  const taskerAlreadyRated = job.taskerRating != null;
  const canRateTasker = seekerAlreadyRated && !taskerAlreadyRated;

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title={job.seekerName}
        subtitle={meta.label}
        accent="teal"
        onBack={() => router.back()}
      />
      <View className="flex-1" style={{ paddingBottom: 64 + insets.bottom }}>
        <View className="bg-white border-b border-brand-stoneBorder p-3 flex-row items-center">
          <Avatar uri="https://placehold.co/100x100/ea580c/ffffff?text=KV" name={job.seekerName} size={42} />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-poppins font-semibold text-brand-stoneDark">{job.seekerName}</Text>
            <Text className="text-[11px] text-brand-teal font-medium">● Khách hàng</Text>
          </View>
          <Pressable className="w-9 h-9 items-center justify-center" hitSlop={6}>
            <FontAwesome name="phone" size={18} color="#0f766e" />
          </Pressable>
        </View>

        <View className="bg-white px-4 py-3 border-b border-brand-stoneBorder">
          <View className="flex-row items-center">
            <View
              className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                meta.accent === "orange" ? "bg-brand-orangeLight" : "bg-brand-tealLight"
              }`}
            >
              <FontAwesome name={meta.icon} size={14} color={meta.accent === "orange" ? "#ea580c" : "#0f766e"} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                {job.title}
              </Text>
              <Text className="text-xs text-stone-500 mt-0.5" numberOfLines={1}>
                {job.location}
              </Text>
            </View>
            <Text className="text-sm font-poppins font-bold text-brand-teal">{formatVND(job.budget)}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="items-center my-3">
            <Text className="text-[11px] text-stone-500 bg-stone-200 px-3 py-1 rounded-full">
              {job.timeTag} · Ký quỹ {formatVND(job.budget)}
            </Text>
          </View>
          {job.chats.map((m, i) => {
            const mine = m.sender === "tasker";
            return (
              <View key={i} className={`mb-2 max-w-[80%] ${mine ? "self-end" : "self-start"}`}>
                <View
                  className={`px-3 py-2 rounded-2xl ${
                    mine ? "bg-brand-teal rounded-tr-sm" : "bg-white border border-brand-stoneBorder rounded-tl-sm"
                  }`}
                >
                  <Text className={`text-sm ${mine ? "text-white" : "text-brand-stoneDark"}`}>{m.text}</Text>
                </View>
                <Text className={`text-[10px] text-stone-500 mt-0.5 ${mine ? "text-right" : ""}`}>{m.time}</Text>
              </View>
            );
          })}

          {job.status === "completed" ? (
            <View className="mt-4 bg-brand-tealLight rounded-2xl p-4 items-center">
              <FontAwesome name="check-circle" size={28} color="#0f766e" />
              <Text className="text-brand-teal font-poppins font-bold text-base mt-2">Đã hoàn thành</Text>
              {job.taskerRating != null ? (
                <View className="mt-2 flex-row items-center">
                  <StarRating value={job.taskerRating} readOnly size={16} />
                  <Text className="text-xs text-stone-600 ml-2">Khách hàng đánh giá bạn</Text>
                </View>
              ) : canRateTasker ? (
                <View className="mt-2 w-full">
                  <Text className="text-xs text-stone-600 mb-1 text-center">Đánh giá khách hàng:</Text>
                  <View className="items-center">
                    <StarRating
                      value={0}
                      onChange={(r) => rateJob(job.id, "tasker", r)}
                      size={24}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {job.status === "assigned" ? (
          <View className="absolute left-0 right-0 px-4" style={{ bottom: 80 + insets.bottom }}>
            <Button
              onPress={() => setShowReport(true)}
              fullWidth
              size="md"
              variant="primary"
            >
              Báo cáo hoàn thành
            </Button>
          </View>
        ) : null}

        <View
          className="absolute left-0 right-0 bg-white border-t border-brand-stoneBorder px-3 py-2 flex-row items-center"
          style={{ bottom: 0, paddingBottom: insets.bottom + 8 }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#a8a29e"
            className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm text-brand-stoneDark"
            multiline
          />
          <Pressable onPress={send} className="ml-2 w-9 h-9 rounded-full bg-brand-teal items-center justify-center" hitSlop={6}>
            <FontAwesome name="paper-plane" size={14} color="white" />
          </Pressable>
        </View>
      </View>

      <Modal visible={showReport} onClose={() => setShowReport(false)} title="Báo cáo hoàn thành">
        <View className="items-center mb-3">
          <View className="w-14 h-14 rounded-full bg-brand-tealLight items-center justify-center">
            <FontAwesome name="check-circle" size={28} color="#0f766e" />
          </View>
        </View>
        <Text className="text-center text-sm text-stone-700 leading-relaxed mb-4">
          Xác nhận bạn đã hoàn thành công việc. Hệ thống sẽ thông báo cho khách hàng để giải ngân ký quỹ.
        </Text>
        <View className="flex-row gap-3">
          <Button variant="ghost" onPress={() => setShowReport(false)} style={{ flex: 1 }}>
            Huỷ
          </Button>
          <Button variant="secondary" onPress={onReportComplete} style={{ flex: 1 }}>
            Xác nhận
          </Button>
        </View>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 4: Create `app/(app)/tasker/earnings.tsx`**

The chart is rendered with `View` bars (no chart library) for the demo.

```tsx
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTasker } from "@/hooks/useTasker";
import { formatVND } from "@/lib/format";

const WEEK = [
  { d: "T2", v: 320_000 },
  { d: "T3", v: 480_000 },
  { d: "T4", v: 220_000 },
  { d: "T5", v: 0 },
  { d: "T6", v: 650_000 },
  { d: "T7", v: 800_000 },
  { d: "CN", v: 380_000 },
];

export default function TaskerEarningsScreen() {
  const { wallet, escrowPool, myCompletedJobs, showToast } = useTasker();
  const [tab, setTab] = useState<"week" | "month" | "all">("week");
  const total = WEEK.reduce((s, x) => s + x.v, 0);
  const maxV = Math.max(...WEEK.map((x) => x.v), 1);

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title="Thu nhập"
        subtitle="Theo dõi thu nhập của bạn"
        accent="teal"
        onBell
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase">Tổng thu nhập tuần này</Text>
          <Text className="text-3xl font-poppins font-extrabold text-brand-stoneDark mt-1">
            {formatVND(total)}
          </Text>
          <View className="flex-row gap-2 mt-3">
            {([
              { k: "week", label: "Tuần" },
              { k: "month", label: "Tháng" },
              { k: "all", label: "Tất cả" },
            ] as const).map((t) => {
              const active = t.k === tab;
              return (
                <Pressable
                  key={t.k}
                  onPress={() => setTab(t.k)}
                  className={`px-3 py-1.5 rounded-full border ${
                    active ? "bg-brand-teal border-brand-teal" : "bg-white border-brand-stoneBorder"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${active ? "text-white" : "text-stone-700"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Biểu đồ 7 ngày</Text>
          <View className="flex-row items-end justify-between h-32">
            {WEEK.map((d) => {
              const h = (d.v / maxV) * 100;
              return (
                <View key={d.d} className="items-center flex-1">
                  <View className="w-5 rounded-t-md bg-brand-teal" style={{ height: `${h}%`, minHeight: 4 }} />
                  <Text className="text-[10px] text-stone-500 mt-1">{d.d}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-brand-stoneBorder">
            <Text className="text-xs text-stone-500">Ví khả dụng</Text>
            <Text className="text-base font-poppins font-bold text-brand-stoneDark mt-1">
              {formatVND(wallet)}
            </Text>
            <Pressable
              onPress={() => showToast("Tính năng rút tiền đang được phát triển", "info")}
              className="mt-2 bg-brand-tealLight rounded-lg py-2"
            >
              <Text className="text-center text-xs font-semibold text-brand-teal">Rút tiền</Text>
            </Pressable>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-brand-stoneBorder">
            <Text className="text-xs text-stone-500">Ký quỹ chờ</Text>
            <Text className="text-base font-poppins font-bold text-brand-stoneDark mt-1">
              {formatVND(escrowPool)}
            </Text>
            <View className="mt-2 bg-stone-100 rounded-lg py-2">
              <Text className="text-center text-xs font-medium text-stone-500">Sẽ giải ngân</Text>
            </View>
          </View>
        </View>

        <Text className="text-xs font-semibold text-stone-500 uppercase mb-2 ml-1">Công việc đã hoàn thành</Text>
        {myCompletedJobs.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-brand-stoneBorder">
            <FontAwesome name="check-circle" size={28} color="#a8a29e" />
            <Text className="text-stone-500 text-sm mt-2">Chưa có công việc hoàn thành</Text>
          </View>
        ) : (
          myCompletedJobs.map((job) => (
            <View
              key={job.id}
              className="bg-white rounded-2xl p-4 mb-3 border border-brand-stoneBorder flex-row items-center"
            >
              <View className="w-9 h-9 rounded-lg bg-brand-tealLight items-center justify-center mr-3">
                <FontAwesome name="check" size={14} color="#0f766e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins font-semibold text-brand-stoneDark" numberOfLines={1}>
                  {job.title}
                </Text>
                <Text className="text-[11px] text-stone-500 mt-0.5">{job.timeTag}</Text>
              </View>
              <Text className="text-sm font-poppins font-bold text-brand-teal">+{formatVND(job.budget)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 5: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/tasker/active.tsx" "app/(app)/tasker/chat/" "app/(app)/tasker/earnings.tsx"
git commit -m "feat(tasker): add active jobs, chat detail, and earnings screen"
```

---

## Phase 7: Profile & Modals

### Task 7.1: Profile screen + role switch + logout modal

**Files:**
- Create: `app/(app)/profile.tsx`
- Create: `components/ui/LogoutModal.tsx`

Implements spec §6.7 (seeker profile), §7.5 (tasker profile), role switcher from §6.1, and logout modal.

- [ ] **Step 1: Create `components/ui/LogoutModal.tsx`**

```tsx
import { Button } from "./Button";
import { Modal } from "./Modal";
import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogoutModal({ visible, onClose, onConfirm }: Props) {
  return (
    <Modal visible={visible} onClose={onClose} title="Đăng xuất">
      <View className="items-center mb-3">
        <View className="w-14 h-14 rounded-full bg-brand-orangeLight items-center justify-center">
          <FontAwesome name="lock" size={26} color="#ea580c" />
        </View>
      </View>
      <Text className="text-center text-sm text-stone-700 leading-relaxed mb-4">
        Bạn có chắc chắn muốn đăng xuất? Dữ liệu demo sẽ được khởi tạo lại khi đăng nhập lại.
      </Text>
      <View className="flex-row gap-3">
        <Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>
          Huỷ
        </Button>
        <Button variant="primary" onPress={onConfirm} style={{ flex: 1 }}>
          Đăng xuất
        </Button>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Create `app/(app)/profile.tsx`**

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useGiGood } from "@/lib/GiGoodContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useSeeker } from "@/hooks/useSeeker";
import { useTasker } from "@/hooks/useTasker";
import { CATEGORY_META, AVAILABILITY_LABEL, VEHICLE_LABEL } from "@/lib/categories";
import { formatVND } from "@/lib/format";

export default function ProfileScreen() {
  const router = useRouter();
  const { state, dispatch } = useGiGood();
  const { push: pushNotif } = useNotifications();
  const { showToast } = useSeeker();
  const seeker = useSeeker();
  const tasker = useTasker();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const profile = state.auth.profile;
  const role = state.auth.currentRole;
  const isTasker = role === "tasker";

  const onSwitchRole = (next: "seeker" | "tasker") => {
    if (next === role) return;
    dispatch({ type: "SWITCH_ROLE", role: next });
    dispatch({ type: "SET_SEEKER_SUBTAB", tab: "post" });
    dispatch({ type: "SET_TASKER_SUBTAB", tab: "board" });
    showToast(`Đã chuyển sang chế độ ${next === "seeker" ? "người thuê" : "người làm"}`, "info");
    router.replace(next === "seeker" ? "/(app)/seeker/post" : "/(app)/tasker/board");
  };

  const onLogout = () => {
    setLogoutOpen(false);
    dispatch({ type: "LOGOUT" });
    showToast("Đã đăng xuất", "info");
    router.replace("/welcome");
  };

  if (!profile) {
    return (
      <View className="flex-1 bg-brand-stoneLight">
        <ScreenHeader title="Hồ sơ" onBack={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-stoneLight">
      <ScreenHeader
        title="Hồ sơ"
        subtitle="Quản lý tài khoản của bạn"
        onBell={() => dispatch({ type: "OPEN_NOTIFS" })}
        showBadge={state.ui.notifBadge}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="bg-white rounded-2xl p-5 border border-brand-stoneBorder items-center mb-4">
          <Avatar uri={profile.avatar} name={profile.name} size={88} ringClass="border-4 border-white shadow" />
          <Text className="text-lg font-poppins font-bold text-brand-stoneDark mt-3">{profile.name}</Text>
          <Text className="text-xs text-stone-500 mt-0.5">{profile.phone}</Text>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="map-marker" size={11} color="#78716c" />
            <Text className="text-xs text-stone-500 ml-1">{profile.location}</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
          <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Chuyển chế độ</Text>
          <RoleSwitcher value={role} onChange={onSwitchRole} />
        </View>

        {isTasker && profile.taskerProfile ? (
          <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
            <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Hồ sơ tasker</Text>
            <Row label="Kỹ năng" value={profile.taskerProfile.skills.map((s) => CATEGORY_META[s].label).join(", ")} />
            <Row label="Thời gian" value={AVAILABILITY_LABEL[profile.taskerProfile.availability]} />
            <Row label="Phương tiện" value={VEHICLE_LABEL[profile.taskerProfile.vehicle]} />
            <Row label="Trạng thái" value={profile.taskerProfile.verified ? "Đã xác minh" : "Chưa xác minh"} />
            {profile.taskerProfile.bio ? <Row label="Giới thiệu" value={profile.taskerProfile.bio} /> : null}
            <Pressable
              onPress={() => {
                pushNotif("Hồ sơ của bạn đã được cập nhật", new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
                showToast("Đã lưu thay đổi", "success");
              }}
              className="bg-brand-tealLight rounded-xl py-3 mt-3"
            >
              <Text className="text-center text-sm font-semibold text-brand-teal">Cập nhật hồ sơ</Text>
            </Pressable>
          </View>
        ) : null}

        {!isTasker ? (
          <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
            <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Ví người thuê</Text>
            <Row label="Số dư khả dụng" value={formatVND(seeker.wallet)} />
            <Row label="Tổng việc đã đăng" value={`${seeker.myJobs.length} việc`} />
            <Pressable
              onPress={() => showToast("Tính năng nạp tiền đang được phát triển", "info")}
              className="bg-brand-orangeLight rounded-xl py-3 mt-3"
            >
              <Text className="text-center text-sm font-semibold text-brand-orange">Nạp thêm vào ví</Text>
            </Pressable>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-brand-stoneBorder mb-4">
            <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Ví người làm</Text>
            <Row label="Số dư khả dụng" value={formatVND(tasker.wallet)} />
            <Row label="Ký quỹ chờ" value={formatVND(tasker.escrowPool)} />
            <Row label="Đã hoàn thành" value={`${tasker.myCompletedJobs.length} việc`} />
            <Pressable
              onPress={() => showToast("Tính năng rút tiền đang được phát triển", "info")}
              className="bg-brand-tealLight rounded-xl py-3 mt-3"
            >
              <Text className="text-center text-sm font-semibold text-brand-teal">Rút tiền về tài khoản</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => setLogoutOpen(true)}
          className="bg-white rounded-2xl p-4 border border-red-200 flex-row items-center justify-center mb-6"
        >
          <FontAwesome name="lock" size={16} color="#dc2626" />
          <Text className="ml-2 text-red-600 font-semibold">Đăng xuất</Text>
        </Pressable>
      </ScrollView>

      <LogoutModal visible={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={onLogout} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start py-2 border-b border-brand-stoneBorder last:border-b-0">
      <Text className="text-xs text-stone-500 w-24">{label}</Text>
      <Text className="flex-1 text-sm text-brand-stoneDark" numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/profile.tsx" components/ui/LogoutModal.tsx
git commit -m "feat(profile): add profile screen with role switch and logout"
```

---

## Phase 8: Polish, Smoke Test & Final Pass

### Task 8.1: Final pass

**Files:** (no new files; check existing ones)

- [ ] **Step 1: Run final typecheck + lint**

```bash
npx tsc --noEmit
npx expo lint
```

Both must be zero errors and zero warnings.

- [ ] **Step 2: Verify file inventory**

Run from repo root:

```bash
ls app
ls "app/(app)/seeker" "app/(app)/tasker" "app/(auth)"
ls components/ui
ls lib hooks types
```

Expected:
- `app/` contains `index.tsx`, `_layout.tsx`, `(auth)/`, `(app)/`
- `app/(app)/seeker` contains `index.tsx`, `post.tsx`, `jobs.tsx`, `chat/index.tsx`, `chat/[jobId].tsx`, `history.tsx`
- `app/(app)/tasker` contains `index.tsx`, `board.tsx`, `active.tsx`, `chat/index.tsx`, `chat/[jobId].tsx`, `earnings.tsx`
- `app/(app)/` contains `_layout.tsx`, `seeker/`, `tasker/`, `profile.tsx`
- `app/(auth)/` contains `_layout.tsx`, `welcome.tsx`, `login.tsx`, `signup-tasker.tsx`
- `components/ui` contains 12 files: `Avatar`, `BottomTabs`, `Button`, `Field`, `MiniMap`, `Modal`, `NotificationsPanel`, `RoleSwitcher`, `ScreenHeader`, `StarRating`, `StatusPill`, `Toast`
- `lib` contains 4 files: `GiGoodContext`, `categories`, `format`, `seed`
- `hooks` contains 6 files: `useSeeker`, `useTasker`, `useJobs`, `useNotifications`, `useUi`
- `types/index.ts` exists

- [ ] **Step 3: Manual smoke walkthrough checklist**

This is a quick checklist for the human or implementer running `npx expo start` to walk through once.

1. Welcome → tap "Tôi cần thuê người" → Login screen.
2. Enter any 10-digit phone (default `0901234567`) + any password → toast "Đăng nhập thành công!" → Seeker `post` tab.
3. Tap "Tìm tasker gần bạn" → 1.8s loading → navigate to chat detail of new job.
4. Send a message → expect tasker auto-reply after 1.2s.
5. Go back → Jobs tab → new job appears with "Đang tìm người" status.
6. Open Profile → switch to "Người làm" → Board tab → new job shows as a map marker.
7. Tap "Nhận việc" → confirm → land on tasker chat detail.
8. Tap "Báo cáo hoàn thành" → toast → status still "assigned" (waiting for seeker).
9. Switch back to "Người thuê" → Chat tab → tap the conversation → tap "Xác nhận hoàn thành & giải ngân" → confirm → rate modal appears.
10. Submit rating → back to chat detail with "Hoàn thành" status, stars visible.
11. Bell icon → push a notification via Profile "Cập nhật hồ sơ" → reopen panel, see item.
12. Logout → confirm → land on Welcome.

- [ ] **Step 4: Final commit**

If Step 3 surfaced small issues, fix them in individual commits first. Then:

```bash
git log --oneline
```

Confirm ~13 commits in chronological order matching the phase plan.

---

## Self-Review (pre-execution)

Walk through this checklist before handing the plan to an executor:

- [ ] **Coverage:** Every section in `docs/superpowers/specs/2026-06-21-gigood-frontend-demo-design.md` is addressed by at least one task. (Sections 5.1–5.3 → Phase 4; 6.1–6.7 → Phases 5/7; 7.1–7.5 → Phase 6/7; §3, §4 → Phase 2; §2 → Task 1.2.)
- [ ] **No placeholders:** Every `code block` is a complete, syntactically valid C#/TSX module ready to drop in. The only deliberate omission is the `npx expo install --fix` step which may rewrite versions beyond the listed examples.
- [ ] **Type safety:** All hooks, components, and screens import types from `@/types`; no `any` introduced.
- [ ] **TDD not applied** (per spec §2.2: frontend-only demo, no test runner configured). Verification is typecheck + lint + manual smoke.
- [ ] **File paths absolute/relative clarity:** All file paths in tasks are repo-relative and exist or are created by an earlier step.
- [ ] **State design coherent:** Reducer actions are all dispatched from typed hooks/screens; no component reaches into `useGiGood` directly except the layout files and the `NotificationsPanel` (which is by design global).
- [ ] **No unused actions:** `WITHDRAW` is included in the reducer for future extension; the only consumer for now would be a future "withdraw from escrow" feature. If we want to be strict, remove it; otherwise leave it. (Keep; harmless.)
- [ ] **No emojis added** to any file (per AGENTS.md "DO NOT ADD COMMENTS" rule, interpreted as also no decorative emojis in code).
- [ ] **Vietnamese strings inline**, no i18n setup, matches HTML content.
- [ ] **Brand colors** are referenced via Tailwind classes (`bg-brand-orange`, `text-brand-teal`, etc.) defined in `tailwind.config.js`.

---

## Execution Handoff

**Pick one execution mode before starting Task 1.1:**

1. **superpowers:subagent-driven-development** (recommended) — You (the orchestrator) stay in the main session and dispatch a fresh subagent per task. The subagent edits files, runs `npx tsc --noEmit` + `npx expo lint`, commits, and returns a summary. You review and dispatch the next task. Fast context isolation, easy course-correction per task.

2. **superpowers:executing-plans** — You (the main agent) execute every step inline. Slower, but the entire implementation lives in one session and you can adjust the plan as you go.

3. **Manual / handoff to user** — Print the task list as a checklist and let the human drive. Useful if the user wants to learn the codebase themselves.

State the chosen mode and begin.
