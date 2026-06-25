import { createContext } from "react";
import type { Notification, NotificationPreferences } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: NotificationPreferences) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  preferences: DEFAULT_PREFERENCES,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  updatePreferences: async () => {},
});
