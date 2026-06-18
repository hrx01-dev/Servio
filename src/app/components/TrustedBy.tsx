import { motion } from "motion/react";

const companies = [
  { name: "Vercel", logo: "▲ Vercel" },
  { name: "Stripe", logo: "/ Stripe" },
  { name: "Linear", logo: "◈ Linear" },
  { name: "Notion", logo: "○ Notion" },
  { name: "Figma", logo: "✦ Figma" },
  { name: "Framer", logo: "◇ Framer" },
  { name: "Supabase", logo: "⬡ Supabase" },
  { name: "Railway", logo: "◉ Railway" },
];

export function TrustedBy() {
  return (
    <section className="py-14 bg-white dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-10"
        >
          Trusted by teams at
        </motion.p>

        {/* Scrolling strip */}
        <div className="relative">
          <div className="flex gap-12 items-center justify-center flex-wrap">
            {companies.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-300 cursor-default select-none"
              >
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {company.logo}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
