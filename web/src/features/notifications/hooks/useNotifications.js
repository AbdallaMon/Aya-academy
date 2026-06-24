"use client";

// Encapsulates the notification data flow: unread count + recent list + the
// mark-read / mark-all-read mutations. All data goes through useRequest.

import { useCallback } from "react";
import { useRequest } from "../../../hooks/request/useRequest.js";

export function useNotifications({ canList, listLimit = 8 } = {}) {
  const countReq = useRequest({
    url: "notifications/unread-count",
    method: "get",
    autoFetch: !!canList,
    syncToUrl: false,
  });

  const listReq = useRequest({
    url: "notifications",
    method: "get",
    isPaginated: true,
    autoFetch: !!canList,
    syncToUrl: false,
    initialParams: { limit: listLimit },
  });

  const markOneReq = useRequest({
    url: "notifications",
    method: "patch",
    shouldAutoToast: false,
  });

  const markAllReq = useRequest({
    url: "notifications/read-all",
    method: "patch",
    shouldAutoToast: true,
  });

  const refreshAll = useCallback(() => {
    countReq.triggerRefetch();
    listReq.triggerRefetch();
  }, [countReq, listReq]);

  const markRead = useCallback(
    async (id) => {
      await markOneReq.fetchData(`${id}/read`);
      refreshAll();
    },
    [markOneReq, refreshAll],
  );

  const markAll = useCallback(async () => {
    await markAllReq.fetchData();
    refreshAll();
  }, [markAllReq, refreshAll]);

  return {
    unreadCount: countReq.data?.count ?? 0,
    items: listReq.data || [],
    isLoading: listReq.isLoading,
    refreshAll,
    markRead,
    markAll,
    isMarkingAll: markAllReq.isLoading,
  };
}
