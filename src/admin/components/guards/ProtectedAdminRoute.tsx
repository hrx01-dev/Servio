import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/useAdmin";
import { AdminLoading } from "../AdminLoading";

/**
 * Gate for the whole authenticated admin area. Renders nested routes only when
 * a signed-in user has a valid, enabled admin profile. Otherwise redirects:
 *  - not signed in        → /admin/login
 *  - signed in, not admin → /admin/unauthorized
 *
 * This is a UX guard; real enforcement lives in firestore.rules.
 */
export function ProtectedAdminRoute() {
  const { firebaseUser, isAdmin, loading } = useAdmin();
  const location = useLocation();

  if (loading) {
    return <AdminLoading label="Checking access…" />;
  }

  if (!firebaseUser) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <Outlet />;
}
