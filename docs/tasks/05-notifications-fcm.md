# 05 — Notifications REST + NotificationHub (Local Only)

**Goal:** Replace demo `notifications:Notification[]` in-memory with persisted notifications and a foreground SignalR hub. **Local only** — no remote push.

**Depends:** 01, 04, 06 (needs escrow event `OnEscrowReleased`; implement after escrow or stub escrow events). **Branch:** `feat/05-notifications` off `master`.

**API contract:**
- `GET /api/notifications?cursor&limit -> 200 {notifications, nextCursor, unreadCount}`.
- `POST /api/notifications/mark-read {ids?:Guid[] | all:bool} -> 204`.
- `DELETE /api/notifications -> 204` (clear).
- Entity `Notifications(Id Guid, UserId FK, Type string[JobMatched/EscrowReleased/NewMessage], Title, Body, JobId? FK, Read bool, CreatedAt)` index `UserId, Read, CreatedAt desc`.
- Hub `NotificationHub` event `NewNotification(notification)` sent to `Clients.User(userId)` on job matched/escrow/message.

**Mobile (Expo):**
- `useNotifications` keeps its demo surface: `{notifications, unreadCount, hasUnread, markRead, clear}` backed by React Query + hub cache updates.
- Tray same as demo `AppLayout` notif dropdown + notifications screen full list: unread `bg-[#f0fdf4] border-[#bbf7d0]` + dot, tap marks read.
- Foreground: `NotificationHub` updates tray/badge live. No FCM/Firebase — remote push deferred post-2w.

**Files to touch:**
- `Api/Hubs/NotificationHub.cs`, `Api/Features/Notifications/*`, `Api/Data/AppDbContext.cs`.
- `app_mobile/lib/features/notifications/{api.ts, types.ts, hooks/useNotifications.ts, screens/notifications.tsx, components/NotificationTile.tsx}`, `app_mobile/lib/core/hub/notification-hub.ts`, `app_mobile/lib/components/AppLayout.tsx` header bell badge `hasUnread`.

**Steps:**
1. Migration `NotificationsInit`, seed on job events: `CreateJob -> notify seekers`, `Match -> notify owner`, `NewMessage -> notify other participant`.
2. Broadcast from `JobsEndpoints`/`ChatHub` via `IHubContext<NotificationHub>`.
3. Expo `notificationHub` similar to chat, `on("NewNotification") -> queryClient.setQueryData`.
4. Keep demo vi strings `Chào mừng ... đến với GiGood!` etc as `Title`.
5. Document that remote push (FCM/APNs) is deferred; hub satisfies the in-app notifications screen.

**Acceptance:**
- Trigger job created/accepted/message -> recipient sees tray badge `hasUnread` without refresh, mark read clears badge, `GET /api/notifications` returns persisted after restart.
- Works fully offline under `EXPO_PUBLIC_USE_MOCK=1` with seed notifications.

**Verification:**
```bash
dotnet build Api/
(cd app_mobile && npx tsc --noEmit)
curl -H "Authorization: Bearer $AT" http://localhost:5000/api/notifications | jq .
```

**Commit:** `feat(notifications): hub + tray, local only (#05)`

**Notes:** Do not require a push provider for the 2-week demo; foreground hub is enough. Remote push deferred.
