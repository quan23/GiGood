import { useMemo, useCallback } from "react";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Notification } from "@/types";

export function useNotifications() {
  const { state, dispatch } = useGiGood();
  const notifications = state.data.notifications;
  const badge = state.ui.notifBadge;

  const mockNotifs = useMemo(
    (): Notification[] => [
      { id: 1, text: "Minh Quân đã nhận việc 'Khơi thông thoát sàn'", time: "2 phút trước", read: false },
      { id: 2, text: "Hệ thống: Có 2 việc mới phù hợp với kỹ năng của bạn", time: "1 giờ trước", read: true },
    ],
    [],
  );

  const openNotif = useCallback(() => dispatch({ type: "SET_NOTIF_OPEN", payload: true }), [dispatch]);
  const closeNotif = useCallback(() => dispatch({ type: "SET_NOTIF_OPEN", payload: false }), [dispatch]);
  const setBadge = useCallback((b: boolean) => dispatch({ type: "SET_NOTIF_BADGE", payload: b }), [dispatch]);

  return { notifications: mockNotifs, badge, setBadge, openNotif, closeNotif };
}
