# 05 — Notifications Hub + FCM Stub + Tray

**Goal:** Replace `notifications:Notification[]` in-memory with persisted + push-ready notifications.

**Depends:** 01, 04. **Branch:** `feat/05-notifications` off `master`.

**API contract:**
- `GET /api/notifications?cursor&limit -> 200 {notifications, nextCursor, unreadCount}`.
- `POST /api/notifications/mark-read {ids?:Guid[] | all:bool} -> 204`.
- `DELETE /api/notifications -> 204` (clear).
- Entity `Notifications(Id Guid, UserId FK, Type string[JobMatched/EscrowReleased/NewMessage], Title, Body, JobId? FK, Read bool, CreatedAt)` index `UserId, Read, CreatedAt desc`.
- Hub `NotificationHub` event `NewNotification(notification)` sent to `Clients.User(userId)` on job matched/escrow/message.

**Flutter:**
- `NotificationsBloc` states `NotificationsLoaded(list, unread, hasMore)`.
- Tray same as `AppLayout` notifOpen dropdown + `notifications.tsx` full list: unread `bg-[#f0fdf4] border-[#bbf7d0]` + dot, tap `MARK_NOTIF_READ`.
- FCM stub: `firebase_core` + `firebase_messaging` add but defer token registration to task 11 (or stub `FirebaseMessaging.getToken -> save POST /api/devices/register` with `TODO`). Foreground uses `NotificationHub`, background via FCM when killed (no hub).

**Files to touch:**
- `Api/Hubs/NotificationHub.cs`, `Api/Features/Notifications/*`, `Api/Data/AppDbContext.cs`.
- `app_flutter/lib/features/notifications/{data/*, presentation/bloc/notifications_bloc.dart, pages/notifications_page.dart, widgets/notification_tile.dart}`, `app_flutter/lib/core/hub/notification_hub_service.dart`, `AppLayout` header bell badge `hasUnread`.

**Steps:**
1. Migration `NotificationsInit`, seed `PUSH_NOTIF` on job events: `CreateJob -> notify seekers`, `Match -> notify owner`, `NewMessage -> notify other participant`.
2. Broadcast from `JobsEndpoints`/`ChatHub` via `IHubContext<NotificationHub>`.
3. Flutter `NotificationHubService` similar to chat, `onNewNotification -> Bloc.add(ReceivedNotification)`.
4. Add `firebase_messaging` stub, `AndroidManifest` FCM not required for MVP green; document key `__FCM_SERVER_KEY__`.
5. Keep demo strings `Chào mừng ... đến với GiGood!` etc as `Title`.

**Acceptance:**
- Trigger job created/accepted/message -> recipient sees tray badge `hasUnread` without refresh, mark read clears badge, `GET /api/notifications` returns persisted after restart.
- FCM stub builds even without `google-services.json` (conditional import).

**Verification:**
```bash
dotnet build Api/
flutter analyze
curl -H "Authorization: Bearer $AT" http://localhost:5000/api/notifications | jq .
```

**Commit:** `feat(notifications): hub + FCM stub + tray (#05)`

**Notes:** Do not require real FCM server key for 2-week demo; foreground hub satisfies PRM393 `Notifications screen`. Document `firebase_messaging` deferred.
