import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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
        setAdmin(
          snapshot.exists()
            ? parseAdminProfile(currentUser.uid, snapshot.data())
            : null,
        );
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
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
