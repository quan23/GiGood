/**
 * Mirrors the notification payloads from `Api/Features/Notifications/Dtos.cs`
 * (System.Text.Json camelCase). Keep in sync with `GET /api/notifications`,
 * `POST /api/notifications/mark-read`, `DELETE /api/notifications` and the
 * `NewNotification` hub event.
 */

export type NotificationType = 'Welcome' | 'JobMatched' | 'EscrowReleased' | 'NewMessage'

export type AppNotification = {
  id: string
  /** One of `NotificationType` on the API today; plain string stays forward-compatible. */
  type: NotificationType | string
  title: string
  body: string
  jobId: string | null
  read: boolean
  createdAt: string
}

/** `GET /api/notifications` — newest first + the caller's total `unreadCount`. */
export type NotificationListResponse = {
  notifications: AppNotification[]
  nextCursor: string | null
  unreadCount: number
}
