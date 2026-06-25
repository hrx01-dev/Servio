import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/Firebase/firebase";
import { useAuth } from "@/Firebase/useAuth";
import { AdminContext, AdminContextValue } from "./AdminContextObject";
import { COLLECTIONS, parseAdminProfile } from "../lib/collections";
import { hasPermission, Permission } from "../rbac/permissions";
import { DEV_MOCK_ENABLED, MOCK_ADMIN, MOCK_USER } from "../lib/devMock";
import { AdminProfile } from "../types";

/**
 * Loads the signed-in user's `admins/{uid}` document and exposes role +
 * permission state to the admin portal. Subscribes in real time so role
 * changes (e.g. an admin being disabled) take effect without a reload.
 *
 * Must be rendered inside the app-level <AuthProvider>.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_debug, setDebug] = useState<string | null>(null);
  const lastLoginRecorded = useRef<string | null>(null);

  useEffect(() => {
    // Local preview: skip Firebase entirely and inject a fake super_admin.
    if (DEV_MOCK_ENABLED) {
      setAdmin(MOCK_ADMIN);
      setDocLoading(false);
      setError(null);
      return;
    }

    if (authLoading) return;

    if (!currentUser) {
      setAdmin(null);
      setError(null);
      setDocLoading(false);
      return;
    }

    setDocLoading(true);
    setError(null);
    const ref = doc(db, COLLECTIONS.admins, currentUser.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const exists = snapshot.exists();
        const data = exists ? snapshot.data() : null;
        const parsed = exists
          ? parseAdminProfile(currentUser.uid, data!)
          : null;
        setDebug(
          JSON.stringify({
            uid: currentUser.uid,
            docExists: exists,
            rawData: data,
            parsed: parsed ? "valid" : "null",
          }),
        );
        setAdmin(parsed);
        setDocLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load admin profile.");
        setAdmin(null);
        setDocLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUser, authLoading]);

  // Record lastLoginAt once per session when the admin profile resolves.
  useEffect(() => {
    if (DEV_MOCK_ENABLED || !admin || !currentUser) return;
    if (lastLoginRecorded.current === currentUser.uid) return;
    lastLoginRecorded.current = currentUser.uid;
    const ref = doc(db, COLLECTIONS.admins, currentUser.uid);
    updateDoc(ref, { lastLoginAt: serverTimestamp() }).catch(() => {
      // Best-effort; swallow errors (e.g. offline).
    });
  }, [admin, currentUser]);

  // In mock mode the fake admin must be available synchronously on the first
  // render (before the effect runs), or the route guard bounces to /unauthorized.
  const effectiveAdmin = DEV_MOCK_ENABLED ? MOCK_ADMIN : admin;
  const isAdmin = effectiveAdmin !== null && !effectiveAdmin.disabled;
  const role = isAdmin ? effectiveAdmin.role : null;

  const can = useCallback(
    (permission: Permission) => hasPermission(role, permission),
    [role],
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      firebaseUser: DEV_MOCK_ENABLED ? MOCK_USER : currentUser,
      admin: effectiveAdmin,
      role,
      loading: DEV_MOCK_ENABLED ? false : authLoading || docLoading,
      error,
      isAdmin,
      can,
      _debug,
    }),
    [
      currentUser,
      effectiveAdmin,
      role,
      authLoading,
      docLoading,
      error,
      isAdmin,
      can,
      _debug,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
