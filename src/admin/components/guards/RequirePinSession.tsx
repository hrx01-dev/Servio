import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/useAdmin";
import { usePinGate } from "../../context/usePinGate";

/**
 * Login-session PIN gate for protected admin routes.
 *
 * Placed inside `<ProtectedAdminRoute>` (so the user is always a valid admin
 * when we get here) and outside `<AdminLayout>`. Enforces:
 *
 * - Admin has a PIN configured → must pass PinVerifyPage first.
 * - Admin has no PIN configured → must complete PinSetupPage first.
 * - Admin has passed the PIN step this session → render nested routes.
 *
 * This is a UX guard; real authorization lives in firestore.rules.
 */
export function RequirePinSession() {
  const { admin } = useAdmin();
  const { pinSessionVerified } = usePinGate();
  const location = useLocation();

  // PIN step already cleared for this session — let the request through.
  if (pinSessionVerified) {
    return <Outlet />;
  }

  // No admin doc loaded yet (shouldn't happen here, but be safe).
  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Admin has a PIN → send to the verify page.
  if (admin.pinHash && admin.pinSalt) {
    return (
      <Navigate
        to="/admin/pin-verify"
        replace
        state={{ from: location }}
      />
    );
  }

  // Admin has no PIN (or corrupt record) → send to setup page.
  return (
    <Navigate
      to="/admin/pin-setup"
      replace
      state={{ from: location }}
    />
  );
}
