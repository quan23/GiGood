import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr'
import type { QueryClient } from '@tanstack/react-query'
import { getAccessToken } from '../../core/storage/secure-store'
import { API_BASE_URL, USE_MOCK } from '../../core/config/env'
import type { AppNotification, NotificationListResponse } from './types'

export type NewNotificationHandler = (notification: AppNotification) => void

let connection: HubConnection | null = null
let startPromise: Promise<void> | null = null

/**
 * Lazily builds (never starts) the singleton `/hubs/notifications` connection.
 * Server-push only — clients listen for `NewNotification` and invoke nothing.
 * The bearer token is fetched per request from secure storage;
 * `withAutomaticReconnect` honours the task 04 backoff `[0, 2000, 10000]`.
 */
export function getNotificationHub(): HubConnection {
  if (connection) return connection

  connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/notifications`, {
      accessTokenFactory: async () => (await getAccessToken()) ?? '',
    })
    .withAutomaticReconnect([0, 2000, 10000])
    .build()

  return connection
}

/** Starts the singleton when disconnected. Best effort: never rejects (UI must not block). */
export async function connectNotificationHub(): Promise<void> {
  if (USE_MOCK) return

  const hub = getNotificationHub()
  if (hub.state !== HubConnectionState.Disconnected) return
  if (startPromise) return startPromise

  startPromise = hub
    .start()
    .catch((error) => {
      console.warn('[notifications] hub connect failed:', error)
    })
    .finally(() => {
      startPromise = null
    })

  return startPromise
}

/** Stops and drops the singleton (sign-out / role reset). */
export async function disconnectNotificationHub(): Promise<void> {
  const hub = connection
  connection = null
  startPromise = null
  if (!hub) return
  await hub.stop().catch(() => undefined)
}

/** Typed `NewNotification` subscription; the returned cleanup calls `off`. */
export function onNewNotification(handler: NewNotificationHandler): () => void {
  if (USE_MOCK) return () => undefined
  const hub = getNotificationHub()
  hub.on('NewNotification', handler)
  return () => hub.off('NewNotification', handler)
}

/** React Query key of the notifications first page (the hub writes into it). */
export const notificationsQueryKey = ['notifications', 'list'] as const

/**
 * Prepends a hub-pushed notification to the cached first page (deduped by id)
 * and bumps `unreadCount`; falls back to a one-item page before the first fetch.
 */
export function mergeNotification(
  queryClient: QueryClient,
  notification: AppNotification,
): void {
  queryClient.setQueryData<NotificationListResponse>(notificationsQueryKey, (prev) => {
    if (!prev) {
      return {
        notifications: [notification],
        nextCursor: null,
        unreadCount: notification.read ? 0 : 1,
      }
    }
    if (prev.notifications.some((item) => item.id === notification.id)) return prev
    return {
      notifications: [notification, ...prev.notifications],
      nextCursor: prev.nextCursor,
      unreadCount: prev.unreadCount + (notification.read ? 0 : 1),
    }
  })
}
