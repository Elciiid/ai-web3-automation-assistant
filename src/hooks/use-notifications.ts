"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendApi } from "@/lib/api/backend-client";
import { subscribeToMonitoringRunCompleted } from "@/lib/app-events";
import type { NotificationEvent } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      setNotifications(await backendApi.notifications.list());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load notifications");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeToMonitoringRunCompleted(() => {
    void load(true);
  }), [load]);

  const markRead = useCallback(async (id: string, read = true) => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, read } : notification)),
    );

    try {
      const updated = await backendApi.notifications.markRead(id, read);
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? updated : notification)),
      );
    } catch (requestError) {
      setNotifications(previous);
      setError(requestError instanceof Error ? requestError.message : "Unable to update notification");
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((notification) => !notification.read);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));

    await Promise.allSettled(unread.map((notification) => backendApi.notifications.markRead(notification.id, true)));
  }, [notifications]);

  return useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      loading,
      error,
      refresh: load,
      markRead,
      markAllRead,
    }),
    [error, load, loading, markAllRead, markRead, notifications],
  );
}
