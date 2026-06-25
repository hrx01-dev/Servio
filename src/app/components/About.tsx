import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Target, Heart, Rocket, Globe, Code, Layers, Users } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";

const values = [
  {
    icon: Target,
    title: "Results first",
    description:
      "Every decision we make is tied to a measurable outcome for your business. We don't build websites for the sake of aesthetics — we build them to generate leads, build trust, and convert visitors.",
  },
  {
    icon: Heart,
    title: "Client partnership",
    description:
      "We treat every project as a long-term relationship, not a transaction. You get a dedicated point of contact, transparent communication at every stage, and honest advice — even when it's not what you expected.",
  },
  {
    icon: Rocket,
    title: "Speed without compromise",
    description:
      "Fast delivery doesn't mean cutting corners. Our streamlined process, purpose-built components, and experienced team let us ship polished, production-ready websites in days — not months.",
  },
  {
    icon: Users,
    title: "Small team, big output",
    description:
      "You'll never be handed off to a junior or lost in a large agency's pipeline. Every project is handled by senior developers and designers who care about the quality of their work.",
  },
];

const stack = [
  { icon: Globe, label: "React & Next.js" },
  { icon: Code, label: "TypeScript" },
  { icon: Layers, label: "Tailwind CSS" },
  { icon: Zap, label: "Firebase & Supabase" },
];

const process = [
  {
    step: "01",
    title: "Discovery",
    description:
      "We learn your business goals, target audience, and competitive landscape before writing a single line of code.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "We craft a visual direction tailored to your brand — no generic templates. You see interactive previews and approve before we build.",
  },
  {
    step: "03",
    title: "Build",
    description:
      "Clean, accessible, SEO-optimised code. We use modern tooling so your site loads fast and scales with you.",
  },
  {
    step: "04",
    title: "Launch & Support",
    description:
      "We handle deployment, DNS, and post-launch monitoring. You get ongoing support so you're never left on your own.",
  },
];

export function About() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.55, delay: 0.08 }}
          className="mb-20"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">
            About Servio
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Websites built for{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              your growth
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Servio is a boutique web studio helping startups, small businesses, and creators grow
            their online presence with fast, beautiful, and conversion-focused websites.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.18 }}
          className="mb-20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-3xl p-8 md:p-12 border border-indigo-100 dark:border-indigo-900/50"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our mission</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
            Most small businesses deserve a great website but can't afford the price tag of a large
            agency — or the gamble of hiring freelancers on a marketplace. Servio bridges that gap:
            agency-quality execution at a price that makes sense for early-stage businesses.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.26 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What we stand for</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10">
            Four principles guide every project we take on.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How we work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.34 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How we work</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10">
            A clear process means no surprises — just a smooth path from idea to launch.
          </p>
          <div className="space-y-6">
            {process.map(({ step, title, description }) => (
              <div key={step} className="flex gap-6 items-start">
                <span className="text-3xl font-extrabold text-indigo-200 dark:text-indigo-900 select-none min-w-[3rem]">
                  {step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What we build with</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Modern, battle-tested technologies that are fast, secure, and easy to maintain.
          </p>
          <div className="flex flex-wrap gap-3">
            {stack.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <Icon className="w-4 h-4 text-indigo-500" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.46 }}
          className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to build something great?
          </h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Tell us about your project and we'll get back to you within 24 hours with a free
            proposal.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-7 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Get a free quote
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
