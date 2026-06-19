import { useEffect, useLayoutEffect, useRef } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
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
import { SplashScreen } from "./components/SplashScreen";
import { AuthProvider } from "../Firebase/AuthContext";
import { SignIn } from "../Firebase/SignIn";
import { SignUp } from "../Firebase/SignUp";
import { useAppLoading } from "./hooks/useAppLoading";

const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

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

export default function App() {
  const loading = useAppLoading();
  const landingRef = useRef<HTMLDivElement>(null);

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
  // Route-agnostic so it also works on the 404 route. (Scroll is already
  // restored by the scroll-lock effect's cleanup.)
  const handleExitComplete = () => {
    const target =
      document.getElementById("main-content") ??
      document.querySelector("main") ??
      document.body;
    target.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Landing is always mounted underneath (never display:none → no layout
          shift) and cross-fades in as the splash lifts away. */}
      <motion.div
        ref={landingRef}
        initial={false}
        animate={{ opacity: loading.isReady ? 1 : 0.001 }}
        transition={{ duration: loading.reducedMotion ? 0.2 : 0.8, ease: REVEAL_EASE }}
        aria-hidden={!loading.isReady || undefined}
      >
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
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
    </div>
  );
}
