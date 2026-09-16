import type { AppNotification, NotificationListResponse } from './types'

/**
 * In-memory notification store for `EXPO_PUBLIC_USE_MOCK=1`, mirroring the API
 * contract so the tray/screen keep working without a backend. Each user gets
 * the old demo welcome notification when their list is first read.
 */

const notifications = new Map<string, AppNotification[]>()

let nextMockId = 1

function ensureSeeded(userId: string, name: string): AppNotification[] {
  const existing = notifications.get(userId)
  if (existing) return existing

  const seeded: AppNotification[] = [
    {
      id: `mock-notif-${nextMockId++}`,
      type: 'Welcome',
      title: `Chào mừng ${name} đến với GiGood!`,
      body: 'Bạn sẽ nhận thông báo khi có việc mới, tin nhắn hoặc ký quỹ được giải ngân.',
      jobId: null,
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]
  notifications.set(userId, seeded)
  return seeded
}

export function mockListNotifications(userId: string, name: string): NotificationListResponse {
  const items = ensureSeeded(userId, name)
  return {
    // The API is newest first; seeds are already in that order, but keep it explicit.
    notifications: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    nextCursor: null,
    unreadCount: items.filter((item) => !item.read).length,
  }
}

/** `ids` empty/absent marks every unread row, mirroring `{all:true}`. */
export function mockMarkNotificationsRead(userId: string, name: string, ids?: string[]): void {
  const items = ensureSeeded(userId, name)
  const target = ids && ids.length > 0 ? new Set(ids) : null
  items.forEach((item) => {
    if (!target || target.has(item.id)) {
      item.read = true
    }
  })
}

export function mockClearNotifications(userId: string, name: string): void {
  ensureSeeded(userId, name)
  notifications.set(userId, [])
}
