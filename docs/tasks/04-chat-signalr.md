# 04 — Chat REST + SignalR ChatHub + Expo Hub Service

**Goal:** Real-time chat per job (demo `SEND_CHAT` in-memory -> persisted + WS).

**Depends:** 01, 02. **Branch:** `feat/04-chat` off `master`.

**API contract:**
- `POST /api/conversations {jobId} -> 201 Conversation {id, jobId}` (idempotent: if exists return 200).
- `GET /api/conversations -> 200 Conversation[]` with `lastMessage` + `unreadCount`.
- `POST /api/conversations/{id}/messages {body} -> 201 Message {id, conversationId, senderId, body, createdAt}`.
- `GET /api/conversations/{id}/messages?cursor&limit=20 -> 200 {messages, nextCursor}` desc order, cursor = `createdAt+id`.
- Entities `Conversations(Id Guid, JobId FK unique, CreatedAt)`, `Messages(Id Guid, ConversationId FK index+CreatedAt, SenderId FK, Body string max 2000, CreatedAt)`.
- Hub `ChatHub` methods `JoinJobGroup(jobId)`, `SendMessage(jobId, body)`, events `ReceiveMessage(message)`, `Typing(jobId,userId,bool)`. Auth via `accessTokenFactory`, `Groups.AddToGroupAsync(jobId)`. **JwtBearer must read `access_token` query for `/hubs/*` via `options.Events.OnMessageReceived` or every hub connect 401s.** `JoinJobGroup` validates caller is job owner/assignee. Persist then `SaveChangesAsync` then `CommitAsync` then broadcast (post-commit, GLM P8).

**Mobile (Expo):**
- `useChat` keeps its demo surface: `{conversations, messages, activeChatId, sendMessage, typing}`; React Query for history + SignalR stream merged into the query cache.
- `@microsoft/signalr` `HubConnectionBuilder().withUrl("$baseUrl/hubs/chat", accessTokenFactory)`.
- `lib/features/chat/api.ts` REST for history, `lib/features/chat/hub.ts` for realtime + typing indicator.
- Screens `chat` list + `chat/[id]` detail — keep both: list shows `lastMsg` preview + unread dot, detail shows bubbles `isOwn ? orange/tasker teal` aligning demo `ChatBubble` but using real `Message` model, `FlatList` auto-scroll 100ms, empty `EmptyState("📭")`.

**Files to touch:**
- `Api/Hubs/ChatHub.cs`, `Api/Features/Chat/*`, `Api/Data/AppDbContext.cs`, `Api/Program.cs` `MapHub<ChatHub>("/hubs/chat")` + `RequireAuthorization`.
- `app_mobile/lib/features/chat/{api.ts, types.ts, hooks/useChat.ts, hub.ts, screens/chat.tsx, screens/chat/[id].tsx, components/ChatBubble.tsx}`.

**Steps:**
1. Migration `ChatInit` + indexes `Messages(ConversationId, CreatedAt desc)`.
2. REST endpoints `RequireAuthorization`, verify participant is owner or assigned tasker before returning messages.
3. `ChatHub` `OnConnectedAsync` no auto-join; `JoinJobGroup` validates participation; `SendMessage` creates `Message` row then broadcast.
4. Expo `chatHub` singleton `connect()`, `on("ReceiveMessage")`, `withAutomaticReconnect([0,2000,10000])`, `disconnect()` on logout.
5. `useChat` merges REST history + hub events, deduplicate by `Id`.

**Acceptance:**
- Two devices (or web+device) as seeker+tasker: send REST -> other receives via hub <1s; typing indicator shows; history persists after restart; `Sending` spinner shows.
- `curl GET /api/conversations/:id/messages` paginated `cursor` works after 25 messages.

**Verification:**
```bash
dotnet build Api/
(cd app_mobile && npx tsc --noEmit)
# manual
curl -H "Authorization: Bearer $AT" http://localhost:5000/api/conversations/$ID/messages | jq .
```

**Commit:** `feat(chat): REST+SignalR hub + useChat (#04)`

**Notes:** No remote push for chat; foreground hub only. Defer read receipts, defer `activeChatId` persistence beyond the hook.
