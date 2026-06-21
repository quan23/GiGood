import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'

export function useNotifications() {
  const { state, dispatch } = useGiGood()
  const notifications = state.data.notifications
  const hasUnread = notifications.some(n => !n.read) || state.ui.notifBadge

  const pushNotif = useCallback((text: string, time?: string) => {
    dispatch({ type: 'PUSH_NOTIF', payload: { text, time } })
  }, [dispatch])

  const clearNotifs = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFS' })
  }, [dispatch])

  return { notifications, hasUnread, pushNotif, clearNotifs }
}
