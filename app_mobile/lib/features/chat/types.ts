/**
 * Mirrors the chat payloads from `Api/Features/Chat/Dtos.cs` (System.Text.Json
 * camelCase). Keep in sync with `POST /api/conversations`,
 * `GET /api/conversations`, `POST/GET /api/conversations/{id}/messages` and the
 * `ReceiveMessage`/`Typing` hub events.
 */

export type ConversationDto = {
  id: string
  jobId: string
  createdAt: string
}

export type ConversationJobDto = {
  id: string
  title: string
  status: string
  category: string
  price: number
}

export type ConversationPeerDto = {
  id: string
  name: string
  avatarUrl: string | null
}

export type ConversationLastMessageDto = {
  id: string
  body: string
  senderId: string
  createdAt: string
}

/** `GET /api/conversations` item — `peer` is null while an owner has no tasker message yet. */
export type ConversationListItemDto = {
  id: string
  jobId: string
  job: ConversationJobDto
  peer: ConversationPeerDto | null
  lastMessage: ConversationLastMessageDto | null
  unreadCount: number
}

export type MessageDto = {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
}

/** `GET /api/conversations/{id}/messages` — newest first + opaque cursor. */
export type MessageListResponse = {
  messages: MessageDto[]
  nextCursor: string | null
}

/** `Typing` hub event: `{ jobId, userId, isTyping }`. */
export type TypingEventDto = {
  jobId: string
  userId: string
  isTyping: boolean
}
