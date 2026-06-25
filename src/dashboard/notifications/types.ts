export type NotificationType = "info" | "success" | "warning" | "error";

export type NotificationCategory =
  | "project"
  | "payment"
  | "message"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreferences {
  categories: {
    project: boolean;
    payment: boolean;
    message: boolean;
    system: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  categories: {
    project: true,
    payment: true,
    message: true,
    system: true,
  },
  channels: {
    inApp: true,
    email: false,
    push: false,
  },
};
