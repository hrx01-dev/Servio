import { useContext } from "react";
import { NotificationContext } from "./NotificationContextObject";

export function useNotifications() {
  return useContext(NotificationContext);
}
