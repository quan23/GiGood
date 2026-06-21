import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'
import { SeekerSubTab, TaskerSubTab, ToastVariant } from '../types'

export function useUi() {
  const { state, dispatch } = useGiGood()

  const setSeekerSubTab = useCallback((tab: SeekerSubTab) => {
    dispatch({ type: 'SET_SEEKER_SUB_TAB', payload: tab })
  }, [dispatch])

  const setTaskerSubTab = useCallback((tab: TaskerSubTab) => {
    dispatch({ type: 'SET_TASKER_SUB_TAB', payload: tab })
  }, [dispatch])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, variant } })
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3500)
  }, [dispatch])

  const dismissToast = useCallback(() => {
    dispatch({ type: 'HIDE_TOAST' })
  }, [dispatch])

  return {
    activeSeekerSubTab: state.ui.activeSeekerSubTab,
    activeTaskerSubTab: state.ui.activeTaskerSubTab,
    notifOpen: state.ui.notifOpen,
    notifBadge: state.ui.notifBadge,
    matchingJobIdRef: state.ui.matchingJobIdRef,
    toast: state.ui.toast,
    setSeekerSubTab,
    setTaskerSubTab,
    showToast,
    dismissToast,
  }
}
