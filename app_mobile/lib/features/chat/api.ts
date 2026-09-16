import apiClient from '../../core/api/client'
import type {
  ConversationDto,
  ConversationListItemDto,
  MessageDto,
  MessageListResponse,
} from './types'

const PAGE_SIZE = 20

/** `GET /api/conversations` — newest activity first, includes peer + lastMessage. */
export async function listConversations(): Promise<ConversationListItemDto[]> {
  const { data } = await apiClient.get<ConversationListItemDto[]>('/api/conversations')
  return data
}

/** `POST /api/conversations {jobId}` — idempotent: 201 created, 200 when it already exists. */
export async function createConversation(jobId: string): Promise<ConversationDto> {
  const { data } = await apiClient.post<ConversationDto>('/api/conversations', { jobId })
  return data
}

/** `GET /api/conversations/{id}/messages?cursor&limit` — newest first + `nextCursor`. */
export async function listMessages(
  conversationId: string,
  cursor?: string,
  limit: number = PAGE_SIZE,
): Promise<MessageListResponse> {
  const { data } = await apiClient.get<MessageListResponse>(
    `/api/conversations/${conversationId}/messages`,
    { params: { limit, ...(cursor ? { cursor } : {}) } },
  )
  return data
}

/** `POST /api/conversations/{id}/messages {body}` — the API also broadcasts `ReceiveMessage`. */
export async function sendMessage(conversationId: string, body: string): Promise<MessageDto> {
  const { data } = await apiClient.post<MessageDto>(
    `/api/conversations/${conversationId}/messages`,
    { body },
  )
  return data
}
