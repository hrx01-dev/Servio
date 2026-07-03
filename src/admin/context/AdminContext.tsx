import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/Firebase/useAuth";
import { AdminContext, AdminContextValue } from "./AdminContextObject";
import { hasPermission, Permission } from "../rbac/permissions";
import { DEV_MOCK_ENABLED, MOCK_ADMIN, MOCK_USER } from "../lib/devMock";
import type { AdminProfile } from "../types";

/**
 * Loads the signed-in user's `admins/{uid}` document and exposes role +
 * permission state to the admin portal. Subscribes in real time so role
 * changes (e.g. an admin being disabled) take effect without a reload.
 *
 * Must be rendered inside the app-level <AuthProvider>.
 *
 * This provider is mounted on EVERY route (the shared Navbar reads isAdmin),
 * so the Firestore SDK is reached only through the dynamic imports inside the
 * effects below — and only once a user is actually signed in. Anonymous
 * visitors never download Firestore for admin state (issue #234).
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
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import("../lib/adminProfile")
      .then(({ subscribeAdminProfile }) => {
        if (cancelled) return;
        unsubscribe = subscribeAdminProfile(
          currentUser.uid,
          ({ exists, data, profile }) => {
            setDebug(
              JSON.stringify({
                uid: currentUser.uid,
                docExists: exists,
                rawData: data,
                parsed: profile ? "valid" : "null",
              }),
            );
            setAdmin(profile);
            setDocLoading(false);
          },
          (err) => {
            setError(err.message || "Failed to load admin profile.");
            setAdmin(null);
            setDocLoading(false);
          },
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load admin profile.");
        setAdmin(null);
        setDocLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [currentUser, authLoading]);

  // Record lastLoginAt once per session when the admin profile resolves.
  useEffect(() => {
    if (DEV_MOCK_ENABLED || !admin || !currentUser) return;
    if (lastLoginRecorded.current === currentUser.uid) return;
    lastLoginRecorded.current = currentUser.uid;
    import("../lib/adminProfile")
      .then(({ recordAdminLastLogin }) => recordAdminLastLogin(currentUser.uid))
      .catch(() => {
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
