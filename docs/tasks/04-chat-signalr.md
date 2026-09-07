# 04 — Chat REST + SignalR ChatHub + Flutter Hub Service

**Goal:** Real-time chat per job (demo `SEND_CHAT` in-memory -> persisted + WS).

**Depends:** 01, 02. **Branch:** `feat/04-chat` off `master`.

**API contract:**
- `POST /api/conversations {jobId} -> 201 Conversation {id, jobId}` (idempotent: if exists return 200).
- `GET /api/conversations -> 200 Conversation[]` with `lastMessage` + `unreadCount`.
- `POST /api/conversations/{id}/messages {body} -> 201 Message {id, conversationId, senderId, body, createdAt}`.
- `GET /api/conversations/{id}/messages?cursor&limit=20 -> 200 {messages, nextCursor}` desc order, cursor = `createdAt+id`.
- Entities `Conversations(Id Guid, JobId FK unique, CreatedAt)`, `Messages(Id Guid, ConversationId FK index+CreatedAt, SenderId FK, Body string max 2000, CreatedAt)`.
- Hub `ChatHub` methods `JoinJobGroup(jobId)`, `SendMessage(jobId, body)`, events `ReceiveMessage(message)`, `Typing(jobId,userId,bool)`. Auth via `accessTokenFactory`, `Groups.AddToGroupAsync(jobId)`. **JwtBearer must read `access_token` query for `/hubs/*` via `options.Events.OnMessageReceived` (GLM P2) or every hub connect 401s.** `JoinJobGroup` validates caller is job owner/assignee. Persist then `SaveChangesAsync` then `CommitAsync` then broadcast (post-commit, GLM P8).

**Flutter:**
- `ChatBloc` events `LoadConversations, OpenConversation(jobId), SendMessage(text), ReceiveMessage(Message), TypingChanged` states `ConversationsLoaded, MessagesLoaded, Sending, Error`. `signalr_netcore` `HubConnectionBuilder().withUrl("$baseUrl/hubs/chat", accessTokenFactory)`.
- `ChatApi` REST for history, hub for realtime + typing indicator.
- Pages `chat_page` (combined list+detail per `tabs/chat.tsx` combined vs `[id].tsx` route) — keep both: list shows `lastMsg` preview + unread dot, detail shows bubbles `isOwn ? orange/tasker teal` aligning demo `ChatBubble` but using real `Message` model, `ScrollController` auto-scroll 100ms, empty `EmptyState("📭")`.

**Files to touch:**
- `Api/Hubs/ChatHub.cs`, `Api/Features/Chat/*`, `Api/Data/AppDbContext.cs`, `Api/Program.cs` `MapHub<ChatHub>("/hubs/chat")` + `RequireAuthorization`.
- `app_mobile/lib/features/chat/{data/*, presentation/bloc/chat_bloc.dart, hub/chat_hub_service.dart, pages/chat_page.dart, pages/conversation_page.dart, widgets/chat_bubble.dart}`.

**Steps:**
1. Migration `ChatInit` + indexes `Messages(ConversationId, CreatedAt desc)`.
2. REST endpoints `RequireAuthorization`, verify participant is owner or assigned tasker before returning messages.
3. `ChatHub` `OnConnectedAsync` no auto-join; `JoinJobGroup` validates participation; `SendMessage` creates `Message` row then broadcast.
4. Flutter `ChatHubService` singleton `connect()`, `onReceive`, `autoReconnect(0,2,10s)`, `disconnect()` on logout.
5. `ChatBloc` merges REST history + hub stream, deduplicate by `Id`.

**Acceptance:**
- Two phones (or incognito+normal) as seeker+tasker: send REST -> other receives via hub <1s; typing indicator shows; history persists after restart; offline queue not required for MVP but `Sending` spinner shows.
- `curl GET /api/conversations/:id/messages` paginated `cursor` works after 25 messages.

**Verification:**
```bash
dotnet build Api/
flutter analyze
# manual
curl -H "Authorization: Bearer $AT" http://localhost:5000/api/conversations/$ID/messages | jq .
```

**Commit:** `feat(chat): REST+SignalR hub + ChatBloc (#04)`

**Notes:** No Firebase for chat; FCM only for killed-app in task 05. Defer read receipts, defer `activeChatId` persistence beyond bloc.
