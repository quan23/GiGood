import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as notificationsApi from '../lib/features/notifications/api'
import {
  connectNotificationHub,
  mergeNotification,
  notificationsQueryKey,
  onNewNotification,
} from '../lib/features/notifications/hub'
import {
  mockClearNotifications,
  mockListNotifications,
  mockMarkNotificationsRead,
} from '../lib/features/notifications/mock'
import type { NotificationListResponse } from '../lib/features/notifications/types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1'

/**
 * Notifications data source (task 05): React Query list + the foreground
 * `/hubs/notifications` stream. Keeps the demo surface `{notifications,
 * unreadCount, hasUnread, markRead, clear}` — `markRead()` without ids marks
 * every unread row (`{all:true}`). With `EXPO_PUBLIC_USE_MOCK=1` the same
 * contract is served from the in-memory store in
 * `lib/features/notifications/mock.ts` (markRead/clear stay local).
 */
export function useNotifications() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const userId = profile?.id ?? 'mock-user'
  const userName = profile?.name ?? 'bạn'

  const listQuery = useQuery<NotificationListResponse>({
    queryKey: notificationsQueryKey,
    enabled: USE_MOCK || !!profile,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockListNotifications(userId, userName))
        : notificationsApi.listNotifications(),
  })

  // Foreground realtime: the API pushes `NewNotification` to the signed-in user.
  // Dedupe + prepend into the cached first page and bump the badge.
  useEffect(() => {
    if (USE_MOCK || !profile) return undefined
    void connectNotificationHub()
    return onNewNotification((notification) => {
      mergeNotification(queryClient, notification)
    })
  }, [profile, queryClient])

  const markReadMutation = useMutation<
    void,
    unknown,
    string[] | undefined,
    { previous: NotificationListResponse | undefined }
  >({
    mutationFn: async (ids?: string[]) => {
      if (USE_MOCK) {
        mockMarkNotificationsRead(userId, userName, ids)
        return
      }
      await notificationsApi.markNotificationsRead(ids)
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })
      const previous = queryClient.getQueryData<NotificationListResponse>(notificationsQueryKey)
      if (previous) {
        const target = ids && ids.length > 0 ? new Set(ids) : null
        let newlyRead = 0
        const updated = previous.notifications.map((item) => {
          if (item.read || (target && !target.has(item.id))) return item
          newlyRead += 1
          return { ...item, read: true }
        })
        queryClient.setQueryData<NotificationListResponse>(notificationsQueryKey, {
          ...previous,
          notifications: updated,
          unreadCount: Math.max(0, previous.unreadCount - newlyRead),
        })
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      if (!USE_MOCK) void queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })

  const clearMutation = useMutation<
    void,
    unknown,
    void,
    { previous: NotificationListResponse | undefined }
  >({
    mutationFn: async () => {
      if (USE_MOCK) {
        mockClearNotifications(userId, userName)
        return
      }
      await notificationsApi.clearNotifications()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })
      const previous = queryClient.getQueryData<NotificationListResponse>(notificationsQueryKey)
      queryClient.setQueryData<NotificationListResponse>(notificationsQueryKey, {
        notifications: [],
        nextCursor: null,
        unreadCount: 0,
      })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      if (!USE_MOCK) void queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })

  const markRead = useCallback(
    async (ids?: string[]) => {
      await markReadMutation.mutateAsync(ids)
    },
    [markReadMutation],
  )

  const clear = useCallback(async () => {
    await clearMutation.mutateAsync()
  }, [clearMutation])

  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = useCallback(async () => {
    if (USE_MOCK || loadingMore) return
    const current = queryClient.getQueryData<NotificationListResponse>(notificationsQueryKey)
    if (!current?.nextCursor) return

    setLoadingMore(true)
    try {
      const page = await notificationsApi.listNotifications(current.nextCursor)
      queryClient.setQueryData<NotificationListResponse>(notificationsQueryKey, (prev) => {
        if (!prev) return page
        const seen = new Set(prev.notifications.map((item) => item.id))
        const older = page.notifications.filter((item) => !seen.has(item.id))
        return {
          notifications: [...prev.notifications, ...older],
          nextCursor: page.nextCursor,
          unreadCount: page.unreadCount,
        }
      })
    } catch (error) {
      console.warn('[notifications] load more failed:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, queryClient])

  const data = listQuery.data

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    hasUnread: (data?.unreadCount ?? 0) > 0,
    markRead,
    clear,
    loading: USE_MOCK ? false : listQuery.isLoading,
    refreshing: USE_MOCK ? false : listQuery.isRefetching,
    error: USE_MOCK ? null : listQuery.error,
    refetch: listQuery.refetch,
    hasMore: USE_MOCK ? false : !!data?.nextCursor,
    loadingMore,
    loadMore,
    isMarkingRead: markReadMutation.isPending,
    isClearing: clearMutation.isPending,
  }
}
