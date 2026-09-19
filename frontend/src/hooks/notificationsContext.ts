import { createContext, useContext } from "react";

export type NotificationType =
  | "role_granted"
  | "special_badge_awarded"
  | "new_follower"
  | "new_mutual"
  | "legacy";

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  action_path: string | null;
  created_at: string;
  read_at: string | null;
};

export type NotificationPreferences = {
  role_granted_enabled: boolean;
  special_badge_awarded_enabled: boolean;
  new_follower_enabled: boolean;
  new_mutual_enabled: boolean;
};

export type NotificationsContextValue = {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  markRead: (id: number, read: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  updatePreferences: (changes: Partial<NotificationPreferences>) => Promise<void>;
};

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider.");
  }
  return context;
}
