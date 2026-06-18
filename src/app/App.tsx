import { useEffect } from "react";
import { Routes, Route } from "react-router";
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

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
