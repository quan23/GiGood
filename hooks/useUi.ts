import { useCallback } from "react";
import { useGiGood } from "@/lib/GiGoodContext";
import type { ToastVariant, SeekerSubTab, TaskerSubTab } from "@/types";

export function useUi() {
  const { state, dispatch } = useGiGood();

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    dispatch({ type: "SHOW_TOAST", payload: { message, variant } });
  }, [dispatch]);

  const hideToast = useCallback(() => dispatch({ type: "HIDE_TOAST" }), [dispatch]);

  const setSeekerTab = useCallback((tab: SeekerSubTab) => dispatch({ type: "SET_ACTIVE_SEEKER_TAB", payload: tab }), [dispatch]);
  const setTaskerTab = useCallback((tab: TaskerSubTab) => dispatch({ type: "SET_ACTIVE_TASKER_TAB", payload: tab }), [dispatch]);

  return {
    toast: state.ui.toast,
    showToast,
    hideToast,
    activeSeekerSubTab: state.ui.activeSeekerSubTab,
    activeTaskerSubTab: state.ui.activeTaskerSubTab,
    setSeekerTab,
    setTaskerTab,
    activeChatId: state.ui.activeChatId,
    setActiveChatId: (id: number | null) => dispatch({ type: "SET_ACTIVE_CHAT_ID", payload: id }),
    chatDetailOpen: state.ui.chatDetailOpen,
    setChatDetailOpen: (v: boolean) => dispatch({ type: "SET_CHAT_DETAIL_OPEN", payload: v }),
  };
}
