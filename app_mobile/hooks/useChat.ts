import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'
import { Role } from '../types'

export function useChat() {
  const { state, dispatch } = useGiGood()

  const activeChatId = state.ui.activeChatId
  const activeJob = state.data.jobs.find(j => j.id === activeChatId) || null

  const sendChat = useCallback((jobId: number, sender: Role, text: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    dispatch({ type: 'SEND_CHAT', payload: { jobId, sender, text, time } })
  }, [dispatch])

  const openChat = useCallback((jobId: number) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: jobId })
    dispatch({ type: 'SET_CHAT_DETAIL', payload: true })
  }, [dispatch])

  const closeChat = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: null })
    dispatch({ type: 'SET_CHAT_DETAIL', payload: false })
  }, [dispatch])

  return { activeChatId, activeJob, chatDetailOpen: state.ui.chatDetailOpen, sendChat, openChat, closeChat }
}
