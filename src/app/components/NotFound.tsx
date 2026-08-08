import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Home, Compass, ArrowLeft, Sparkles } from "lucide-react";
import { SEO } from "./SEO";
import { Aurora } from "./Aurora";
import { GlassPanel } from "./GlassPanel";
import { SectionFrame } from "./SectionFrame";
import { TempleDivider } from "./TempleDivider";

export default function NotFound() {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SEO title="Page Not Found" noIndex />
      <Aurora intensity={0.55} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,hsl(var(--background)/0.2)_48%,hsl(var(--background)/0.86)_100%)]" />

      <SectionFrame rails={false}>
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45 }} className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Lost in the digital space
              </span>
            </motion.div>

            <GlassPanel tier="strong" className="relative overflow-hidden rounded-3xl p-8 text-center md:p-12 lg:p-16">
              <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

              <div className="relative">
                <motion.div initial={{ scale: 0.75, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.08 }} className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand shadow-elev-2 sm:h-24 sm:w-24">
                  <Compass className="h-10 w-10 sm:h-12 sm:w-12" />
                </motion.div>

                <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45, delay: 0.14 }} className="font-display text-8xl font-semibold leading-none tracking-tight text-gradient-brand sm:text-9xl">
                  404
                </motion.p>

                <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45, delay: 0.2 }} className="font-display mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Page Not Found
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45, delay: 0.26 }} className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Looks like this page took a wrong turn. The URL may be incorrect, or the page may have moved. Let&apos;s get you back on track.
                </motion.p>

                <TempleDivider className="mx-auto my-9 max-w-md" />

                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45, delay: 0.32 }} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/" className="bg-grad-brand inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-elev-2 transition-all hover:-translate-y-0.5 hover:shadow-elev-3 sm:w-auto">
                    <Home className="h-4 w-4" />
                    Go Back Home
                  </Link>
                  <button type="button" onClick={() => window.history.back()} className="glass glass-thin inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-brand/40 sm:w-auto">
                    <ArrowLeft className="h-4 w-4" />
                    Previous Page
                  </button>
                </motion.div>
              </div>
            </GlassPanel>
          </div>
        </main>
      </SectionFrame>
    </div>
  );
}
