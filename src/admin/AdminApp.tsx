import { Navigate, Route, Routes } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";
import { PinGateProvider } from "./context/PinProvider";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedAdminRoute } from "./components/guards/ProtectedAdminRoute";
import { RequirePermission } from "./components/guards/RequirePermission";
import { AdminLogin } from "./pages/AdminLogin";
import { Unauthorized } from "./pages/Unauthorized";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { Clients } from "./pages/Clients";
import { Messages } from "./pages/Messages";
import { Audit } from "./pages/Audit";
import { Settings } from "./pages/Settings";

/**
 * The `/admin/*` route subtree. Mounted from the app router under the shared
 * <AuthProvider>, it layers admin role/permission state (AdminProvider) and the
 * security-PIN gate (PinGateProvider) on top, then defines the protected routes.
 */
export function AdminApp() {
  return (
    <AdminProvider>
      <PinGateProvider>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route path="unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <RequirePermission permission="dashboard:view">
                    <Dashboard />
                  </RequirePermission>
                }
              />
              <Route
                path="projects"
                element={
                  <RequirePermission permission="projects:view">
                    <Projects />
                  </RequirePermission>
                }
              />
              <Route
                path="clients"
                element={
                  <RequirePermission permission="clients:view">
                    <Clients />
                  </RequirePermission>
                }
              />
              <Route
                path="messages"
                element={
                  <RequirePermission permission="messages:view">
                    <Messages />
                  </RequirePermission>
                }
              />
              <Route
                path="audit"
                element={
                  <RequirePermission permission="audit:view">
                    <Audit />
                  </RequirePermission>
                }
              />
              <Route
                path="settings"
                element={
                  <RequirePermission permission="settings:view">
                    <Settings />
                  </RequirePermission>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </PinGateProvider>
    </AdminProvider>
  );
}
