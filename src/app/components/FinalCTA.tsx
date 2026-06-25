import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { SmoothLink } from "./SmoothLink";

export function FinalCTA() {
  const reduce = useReducedMotion();
  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.7 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] via-[#6D28D9] to-[#7C3AED]" />
          {/* Glowing orbs */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-purple-400/20 rounded-full blur-3xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-white/90 text-sm font-medium">Ready to get started?</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Let's Build Your{" "}
              <span className="text-cyan-300">Next Website</span>
            </h2>

            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Partner with Servio to deliver a stunning, conversion-focused website. Get your free proposal today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SmoothLink
                to="contact"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
              >
                Start Your Project
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </SmoothLink>
              <SmoothLink
                to="portfolio"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                View Our Work
              </SmoothLink>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-white/15">
              {["Free proposal within 24h", "No upfront payment", "30-day satisfaction guarantee"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/70 text-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
