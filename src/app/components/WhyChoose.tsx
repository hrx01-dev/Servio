import { motion } from "motion/react";
import { Zap, Palette, Search, Smartphone, Shield, Headphones } from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "We ship your project on time, every time. Our streamlined process ensures quick turnarounds without compromising quality.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    icon: Palette,
    title: "Modern Design",
    description: "Pixel-perfect designs that look stunning on every device, crafted to match your brand and impress your visitors.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
  },
  {
    icon: Search,
    title: "SEO Ready",
    description: "Built with SEO best practices from the ground up — structured data, fast load times, and semantic HTML.",
    color: "from-green-400 to-emerald-500",
    bg: "bg-green-50",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Every project is mobile-first and fully responsive — flawless across phones, tablets, and desktops.",
    color: "from-cyan-400 to-blue-500",
    bg: "bg-cyan-50",
  },
  {
    icon: Shield,
    title: "Secure & Scalable",
    description: "Enterprise-grade security and architecture that grows with your business, no matter the traffic.",
    color: "from-indigo-500 to-purple-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Headphones,
    title: "Ongoing Support",
    description: "We're here after launch. Get priority support, updates, and maintenance to keep your site running perfectly.",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
  },
];

export function WhyChoose() {
  return (
    <section aria-labelledby="why-choose-title" className="py-20 md:py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 dark:via-indigo-900/10 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            Why Servio
          </span>
          <h2 id="why-choose-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Why Businesses{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              Choose Us
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We combine cutting-edge technology with thoughtful design to deliver websites that perform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group flex gap-5 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-700 hover:shadow-lg dark:hover:shadow-indigo-900/20 hover:shadow-indigo-50 transition-all duration-300 bg-white dark:bg-slate-900"
            >
              <div className={`flex-shrink-0 w-12 h-12 ${reason.bg} dark:${reason.bg.replace('50', '900/30')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-6 h-6 bg-gradient-to-br ${reason.color} rounded-md flex items-center justify-center`}>
                  <reason.icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{reason.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}