# GiGood — Kết nối việc vặt tức thì

A mobile-first Vietnamese job marketplace demo (front-end only, session-state in-memory). Built 1:1 from an HTML/CSS/JS design spec.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) + React Native 0.81 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (TailwindCSS utility classes) |
| Animations | React Native Reanimated 4.1.1 |
| Icons | `@expo/vector-icons` / FontAwesome 4 |
| State | React Context + `useReducer` (session-only, no persistence) |
| Backend | **None** — all data is in-memory seed data |

## Project Structure

```
app/
  _layout.tsx           # Root: GiGoodProvider + Stack + Toast
  (auth)/
    index.tsx           # Welcome screen (orange gradient)
    login.tsx           # Phone/password login + quick-login
    role-select.tsx     # Seeker vs Tasker role picker
    signup-basic.tsx    # Step 1: name, phone, password, location
    signup-tasker-profile.tsx  # Step 2: skills, bio, availability, vehicle
  (app)/
    _layout.tsx         # App shell: sticky header, role switcher, wallet/escrow, notif tray
    profile.tsx         # User profile with wallet stats, skills, logout
    notifications.tsx   # Notification list with mark-read
    chat/[id].tsx       # Route-based chat detail
    (tabs)/
      _layout.tsx       # Role-aware tab bar (FontAwesome icons)
      post.tsx          # Seeker: post job with quick templates
      jobs.tsx          # Seeker: matching radar + active jobs + escrow release
      chat.tsx          # Seeker: sidebar chat + inline detail
      history.tsx       # Seeker: completed transactions
      board.tsx         # Tasker: mini-map + available jobs
      active.tsx        # Tasker: assigned jobs + report complete
      earnings.tsx      # Tasker: stat cards + earnings history
components/
  ui/                   # Shared primitives (StarRow, Toast, FormField, etc.)
  modals/               # MatchingOverlay, Rating, ReportConfirm
  shared/               # EmptyState, ChatBubble
hooks/                  # useAuth, useChat, useWallet, useJobs, useUi, useNotifications, useSeeker, useTasker
lib/                    # GiGoodContext (reducer + provider), categories, format, seed data
types/                  # TypeScript types (Job, UserProfile, ChatMessage, etc.)
```

## Features

- **Two-sided role system**: Seeker (orange) hires, Tasker (teal) works — switch anytime
- **Auth flow**: Welcome → Role Select → Signup (basic + tasker profile) or Login (with quick-login)
- **Post job**: 4 quick templates + custom form with category, budget, location
- **Matching radar**: Animated pulse while AI searches for taskers
- **Accept job**: Tasker browses a mini-map + list, accepts jobs
- **Chat**: Combined sidebar + inline detail view for seeker, route-based for tasker
- **Escrow**: Budget held during work, released on completion
- **Ratings**: Star rating on escrow release
- **Wallet & Earnings**: Wallet balance, escrow pool, earnings history

## Running

```bash
npx expo start
```

Then scan the QR with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

No backend, no API keys, no database setup required.
