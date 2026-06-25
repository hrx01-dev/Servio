import { motion, useReducedMotion } from "motion/react";

// The tools and frameworks we build with. These are technologies we use —
// not partners or clients — so the heading deliberately avoids implying any
// endorsement or relationship with these companies.
const tools = [
  "React",
  "Next.js",
  "Tailwind",
  "Vercel",
  "Stripe",
  "Figma",
  "Supabase",
  "Framer",
];

export function TrustedBy() {
  const reduce = useReducedMotion();

  return (
    <section className="py-14 bg-white dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.4 }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-10"
        >
          Built with modern tools
        </motion.p>

        {/* Tech stack strip */}
        <div className="relative">
          <div className="flex gap-12 items-center justify-center flex-wrap">
            {tools.map((tool, i) => (
              <motion.div
                key={tool}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 0.4, delay: i * 0.06 }}
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-300 cursor-default select-none"
              >
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {tool}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
