import apiClient from '../../core/api/client'
import type { NotificationListResponse } from './types'

const PAGE_SIZE = 20

/** `GET /api/notifications?cursor&limit` — newest first, includes total `unreadCount`. */
export async function listNotifications(
  cursor?: string,
  limit: number = PAGE_SIZE,
): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>('/api/notifications', {
    params: { limit, ...(cursor ? { cursor } : {}) },
  })
  return data
}

/** `POST /api/notifications/mark-read {ids?|all}` — 204. No ids (or empty) marks every unread row. */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const body = ids && ids.length > 0 ? { ids } : { all: true }
  await apiClient.post('/api/notifications/mark-read', body)
}

/** `DELETE /api/notifications` — clears the caller's tray (204). */
export async function clearNotifications(): Promise<void> {
  await apiClient.delete('/api/notifications')
}
