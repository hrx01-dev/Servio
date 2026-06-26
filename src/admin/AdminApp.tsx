import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PinGateProvider } from "./context/PinProvider";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedAdminRoute } from "./components/guards/ProtectedAdminRoute";
import { RequirePinSession } from "./components/guards/RequirePinSession";
import { RequirePermission } from "./components/guards/RequirePermission";

// Page-level lazy chunks inside the admin subtree — downloaded only when the
// admin user first navigates to each page.
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.Unauthorized })));
const PinVerify = lazy(() => import('./pages/PinVerify').then(m => ({ default: m.PinVerify })));
const PinSetup = lazy(() => import('./pages/PinSetup').then(m => ({ default: m.PinSetup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectUpdates = lazy(() => import('./pages/ProjectUpdates').then(m => ({ default: m.ProjectUpdates })));
const ProjectBilling = lazy(() => import('./pages/ProjectBilling').then(m => ({ default: m.ProjectBilling })));
const ProjectInvoices = lazy(() => import('./pages/ProjectInvoices').then(m => ({ default: m.ProjectInvoices })));
const PortfolioManagement = lazy(() => import('./pages/PortfolioManagement').then(m => ({ default: m.PortfolioManagement })));
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const Audit = lazy(() => import('./pages/Audit').then(m => ({ default: m.Audit })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function AdminPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * The `/admin/*` route subtree. Mounted from the app router under the shared
 * <AuthProvider>, it layers admin role/permission state (AdminProvider) and the
 * security-PIN gate (PinGateProvider) on top, then defines the protected routes.
 *
 * Authentication + PIN flow:
 *   1. /admin/login        → email/password sign-in
 *   2a. /admin/pin-setup   → PIN creation (first login / PIN missing)
 *   2b. /admin/pin-verify  → PIN entry (PIN already configured)
 *   3.  /admin/dashboard   → full access after PIN gate passes
 */
export function AdminApp() {
  return (
    <PinGateProvider>
      <Suspense fallback={<AdminPageSpinner />}>
        <Routes>
          {/* ── Public / semi-public routes ─────────────────────────── */}
          <Route path="login" element={<AdminLogin />} />
          <Route path="unauthorized" element={<Unauthorized />} />

          {/* ── PIN flow: requires Firebase auth + admin role ────────── */}
          {/*    but does NOT require pinSessionVerified yet              */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="pin-verify" element={<PinVerify />} />
            <Route path="pin-setup" element={<PinSetup />} />

            {/* ── Protected admin area: requires PIN session ──────── */}
            <Route element={<RequirePinSession />}>
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
                  path="updates"
                  element={
                    <RequirePermission permission="projects:view">
                      <ProjectUpdates />
                    </RequirePermission>
                  }
                />
                <Route
                  path="billing"
                  element={
                    <RequirePermission permission="projects:view">
                      <ProjectBilling />
                    </RequirePermission>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <RequirePermission permission="projects:view">
                      <ProjectInvoices />
                    </RequirePermission>
                  }
                />
                <Route
                  path="portfolio"
                  element={
                    <RequirePermission permission="projects:view">
                      <PortfolioManagement />
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
          </Route>

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </PinGateProvider>
  );
}
