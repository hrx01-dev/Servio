import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "../../Firebase/useAuth";
import {
  subscribeToNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  subscribeToPreferences,
  updatePreferences as updatePreferencesService,
} from "./notificationService";
import { NotificationContext } from "./NotificationContextObject";
import type { Notification, NotificationPreferences } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubNotifications = subscribeToNotifications(
      currentUser.uid,
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    const unsubPrefs = subscribeToPreferences(currentUser.uid, setPreferences);

    return () => {
      unsubNotifications();
      unsubPrefs();
    };
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsReadService(id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await markAllAsReadService(currentUser.uid);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [currentUser]);

  const updatePreferences = useCallback(
    async (prefs: NotificationPreferences) => {
      if (!currentUser) return;
      try {
        await updatePreferencesService(currentUser.uid, prefs);
      } catch (error) {
        console.error("Failed to update preferences:", error);
      }
    },
    [currentUser],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        markAsRead,
        markAllAsRead,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
