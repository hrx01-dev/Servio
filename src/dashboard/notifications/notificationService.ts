import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  getDocs,
  Timestamp,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import type {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPreferences,
} from "./types";
import { DEFAULT_PREFERENCES } from "./types";

const NOTIFICATIONS_COLLECTION = "notifications";
const PREFERENCES_COLLECTION = "notificationPreferences";
const PAGE_SIZE = 20;

function docToNotification(
  docSnap: QueryDocumentSnapshot<DocumentData>,
): Notification {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId as string,
    title: data.title as string,
    message: data.message as string,
    type: data.type as NotificationType,
    category: data.category as NotificationCategory,
    isRead: data.isRead as boolean,
    createdAt: (data.createdAt as Timestamp).toDate(),
    actionUrl: (data.actionUrl as string | undefined) ?? undefined,
  };
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(docToNotification);
      callback(notifications);
    },
    (error) => {
      console.error("Notification subscription error:", error);
      onError?.(error);
    },
  );
}

export async function fetchNotificationsPage(
  userId: string,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{
  notifications: Notification[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const q = lastDoc
    ? query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE + 1),
      )
    : query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1),
      );

  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > PAGE_SIZE;
  const docs = hasMore ? snapshot.docs.slice(0, PAGE_SIZE) : snapshot.docs;

  return {
    notifications: docs.map(docToNotification),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
}

export async function markAsRead(notificationId: string): Promise<void> {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    where("isRead", "==", false),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isRead: true });
  });
  await batch.commit();
}

export async function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "isRead">,
): Promise<string> {
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...data,
    isRead: false,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export function subscribeToPreferences(
  userId: string,
  callback: (prefs: NotificationPreferences) => void,
) {
  const ref = doc(db, PREFERENCES_COLLECTION, userId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as NotificationPreferences);
    } else {
      callback(DEFAULT_PREFERENCES);
    }
  });
}

export async function updatePreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const { setDoc } = await import("firebase/firestore");
  const ref = doc(db, PREFERENCES_COLLECTION, userId);
  await setDoc(ref, prefs, { merge: true });
}
