import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthUser } from "./useAuthUser";
import {
  NotificationsContext,
  type AppNotification,
  type NotificationPreferences,
  type NotificationType,
} from "./notificationsContext";
import { supabase } from "../utils/supabase";

const pageSize = 25;

const defaultPreferences: NotificationPreferences = {
  role_granted_enabled: true,
  special_badge_awarded_enabled: true,
  new_follower_enabled: true,
  new_mutual_enabled: true,
};

function asNotification(data: Record<string, unknown>): AppNotification {
  return {
    id: Number(data.id),
    type: data.type as NotificationType,
    title: String(data.title),
    body: String(data.body),
    action_path: typeof data.action_path === "string" ? data.action_path : null,
    created_at: String(data.created_at),
    read_at: typeof data.read_at === "string" ? data.read_at : null,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [hasMore, setHasMore] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: notificationData, error: notificationError }, { data: preferenceData, error: preferenceError }] =
      await Promise.all([
        supabase
          .from("notifications")
          .select("id, type, title, body, action_path, created_at, read_at")
          .order("created_at", { ascending: false })
          .range(0, pageSize - 1),
        supabase
          .from("user_notification_preferences")
          .select("role_granted_enabled, special_badge_awarded_enabled, new_follower_enabled, new_mutual_enabled")
          .maybeSingle(),
      ]);

    if (notificationError) throw notificationError;
    if (preferenceError) throw preferenceError;
    setNotifications((notificationData || []).map(asNotification));
    setPreferences({ ...defaultPreferences, ...(preferenceData || {}) });
    setHasMore((notificationData || []).length === pageSize);
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) {
      queueMicrotask(() => {
        if (!active) return;
        setNotifications([]);
        setPreferences(defaultPreferences);
        setHasMore(false);
        setIsLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      if (active) setIsLoading(true);
    });
    void Promise.resolve()
      .then(() => refresh())
      .catch(() => {
        if (active) setNotifications([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refresh().catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  const markRead = useCallback(
    async (id: number, read: boolean) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read_at: read ? new Date().toISOString() : null }
            : notification,
        ),
      );
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw error;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read_at: notification.read_at || readAt })),
    );
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const clearRead = useCallback(async () => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .not("read_at", "is", null);
    if (error) throw error;
    setNotifications((current) => current.filter((notification) => !notification.read_at));
  }, []);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, action_path, created_at, read_at")
      .order("created_at", { ascending: false })
      .range(notifications.length, notifications.length + pageSize - 1);
    if (error) throw error;
    const next = (data || []).map(asNotification);
    setNotifications((current) => [...current, ...next]);
    setHasMore(next.length === pageSize);
  }, [hasMore, notifications.length, user]);

  const updatePreferences = useCallback(async (changes: Partial<NotificationPreferences>) => {
    const { error } = await supabase
      .from("user_notification_preferences")
      .update(changes);
    if (error) throw error;
    setPreferences((current) => ({ ...current, ...changes }));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      preferences,
      unreadCount: notifications.filter((notification) => !notification.read_at).length,
      isLoading,
      hasMore,
      markRead,
      markAllRead,
      deleteNotification,
      clearRead,
      loadMore,
      updatePreferences,
    }),
    [clearRead, deleteNotification, hasMore, isLoading, loadMore, markAllRead, markRead, notifications, preferences, updatePreferences],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
