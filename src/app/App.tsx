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

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
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
    </div>
  );
}
