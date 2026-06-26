import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Routes, Route, useLocation, BrowserRouter } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { TrustedBy } from "./components/TrustedBy";
import { Services } from "./components/Services";
import { Process } from "./components/Process";
import { Portfolio } from "./components/Portfolio";
import { Pricing } from "./components/Pricing";
import { WhyChoose } from "./components/WhyChoose";
import { Testimonials } from "./components/Testimonials";
import { QuoteForm } from "./components/QuoteForm";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import NotFound from "./components/NotFound";
import { ThemeProvider } from "./hooks/useTheme";
import { SplashScreen } from "./components/SplashScreen";
import { AuthProvider } from "../Firebase/AuthContext";
import { useAppLoading } from "./hooks/useAppLoading";
import { ProtectedRoute } from "../dashboard/components/ProtectedRoute";

// Route-level lazy chunks — each becomes its own JS file, downloaded only
// when the user first navigates to that route.
const AdminApp = lazy(() => import('../admin/AdminApp').then(m => ({ default: m.AdminApp })));
const SignIn = lazy(() => import('../Firebase/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('../Firebase/SignUp').then(m => ({ default: m.SignUp })));
const ServiceDetailPage = lazy(() => import('./components/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(m => ({ default: m.TermsOfService })));
const CookiePolicy = lazy(() => import('./components/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const DashboardLayout = lazy(() => import('../dashboard/components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('../dashboard/pages/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const ProjectProgress = lazy(() => import('../dashboard/pages/ProjectProgress').then(m => ({ default: m.ProjectProgress })));
const UpdatesFeed = lazy(() => import('../dashboard/pages/UpdatesFeed').then(m => ({ default: m.UpdatesFeed })));
const PaymentManagement = lazy(() => import('../dashboard/pages/PaymentManagement').then(m => ({ default: m.PaymentManagement })));
const InvoiceManagement = lazy(() => import('../dashboard/pages/InvoiceManagement').then(m => ({ default: m.InvoiceManagement })));
const ProjectResources = lazy(() => import('../dashboard/pages/ProjectResources').then(m => ({ default: m.ProjectResources })));
const ProjectEstimation = lazy(() => import('../dashboard/pages/ProjectEstimation').then(m => ({ default: m.ProjectEstimation })));
const PricingConfig = lazy(() => import('../dashboard/pages/PricingConfig').then(m => ({ default: m.PricingConfig })));
const NotificationCenter = lazy(() => import('../dashboard/notifications/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const NotificationPreferences = lazy(() => import('../dashboard/notifications/NotificationPreferences').then(m => ({ default: m.NotificationPreferences })));

const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-md focus:bg-white focus:text-slate-900"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <TrustedBy />
        <Services />
        <Process />
        <Portfolio />
        <Pricing />
        <WhyChoose />
        <Testimonials />
        <QuoteForm />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

// The landing page keeps its splash-screen brand intro. That intro must gate
// ONLY the marketing page — auth and /admin routes must never wait on (or be
// made `inert` by) landing-asset loading — so the splash + scroll-lock + inert
// wrapper live here and wrap only the landing route's element.
function LandingShell() {
  const loading = useAppLoading();
  const landingRef = useRef<HTMLDivElement>(null);

  // Lock scroll while the splash covers the viewport; restore on reveal/unmount.
  // This effect is the single owner of body overflow.
  useLayoutEffect(() => {
    if (loading.isReady) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [loading.isReady]);

  // While the splash is up, take the landing out of the tab order, the a11y
  // tree, and pointer hit-testing — this enforces "block interaction beneath"
  // for keyboard/AT users (the overlay blocks pointer input on top).
  useLayoutEffect(() => {
    const el = landingRef.current;
    if (el) el.inert = !loading.isReady;
  }, [loading.isReady]);

  // After the splash has fully lifted away, hand focus to the revealed content.
  const handleExitComplete = () => {
    const target =
      document.getElementById("main-content") ??
      document.querySelector("main") ??
      document.body;
    target.focus({ preventScroll: true });
  };

  return (
    <>
      {/* Landing is always mounted underneath (never display:none → no layout
          shift) and cross-fades in as the splash lifts away. */}
      <motion.div
        ref={landingRef}
        initial={false}
        animate={{ opacity: loading.isReady ? 1 : 0.001 }}
        transition={{ duration: loading.reducedMotion ? 0.2 : 0.8, ease: REVEAL_EASE }}
        aria-hidden={!loading.isReady || undefined}
      >
        <LandingPage />
      </motion.div>

      <AnimatePresence onExitComplete={handleExitComplete}>
        {!loading.isReady && (
          <SplashScreen
            phase={loading.phase}
            label={loading.label}
            progress={loading.progress}
            isError={loading.isError}
            reducedMotion={loading.reducedMotion}
            onRetry={loading.retry}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Set robots meta tag based on environment
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      // In development, use noindex, nofollow to prevent indexing
      // In production, use index, follow (set in index.html)
      if (import.meta.env.DEV) {
        robotsMeta.setAttribute("content", "noindex, nofollow");
      } else {
        robotsMeta.setAttribute("content", "index, follow");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
      <BrowserRouter>
        <ThemeProvider>
          <ScrollToTop />
          <AuthProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Only the landing route is gated behind the splash intro. */}
                <Route path="/" element={<LandingShell />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/admin/*" element={<AdminApp />} />
                <Route path="/services/:slug" element={<ServiceDetailPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="progress" element={<ProjectProgress />} />
                  <Route path="updates" element={<UpdatesFeed />} />
                  <Route path="payments" element={<PaymentManagement />} />
                  <Route path="invoices" element={<InvoiceManagement />} />
                  <Route path="resources" element={<ProjectResources />} />
                  <Route path="estimation" element={<ProjectEstimation />} />
                  <Route path="pricing-config" element={<PricingConfig />} />
                  <Route path="notifications" element={<NotificationCenter />} />
                  <Route path="notification-preferences" element={<NotificationPreferences />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}
