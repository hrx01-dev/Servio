import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Briefcase, Zap, Heart, Coffee, Globe } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";

const benefits = [
  {
    icon: Globe,
    title: "Fully remote",
    description: "Work from anywhere in the world. We judge by output, not location or hours.",
  },
  {
    icon: Zap,
    title: "Fast-moving work",
    description:
      "No endless meetings. You'll ship real projects, see your work live, and get direct client feedback.",
  },
  {
    icon: Heart,
    title: "Work you're proud of",
    description:
      "We only take on projects we believe in. Every site we build is one we'd be happy to show in our portfolio.",
  },
  {
    icon: Coffee,
    title: "Flexible schedule",
    description:
      "We care about results, not hours. Set your own schedule as long as you're available for client check-ins.",
  },
];

const openRoles = [
  {
    title: "Frontend Developer",
    type: "Contract / Freelance",
    location: "Remote — Worldwide",
    description:
      "We're looking for a frontend developer who loves building beautiful, performant interfaces. You'll work primarily in React and TypeScript, implementing designs from Figma into production-ready code.",
    requirements: [
      "3+ years building with React and TypeScript",
      "Strong understanding of CSS and Tailwind",
      "Experience with performance optimisation (Core Web Vitals)",
      "Ability to communicate clearly with non-technical clients",
    ],
  },
  {
    title: "UI / UX Designer",
    type: "Contract / Freelance",
    location: "Remote — Worldwide",
    description:
      "We need a designer who thinks in systems, not just screens. You'll own the visual direction of client projects from brief to final handoff, working closely with our developers.",
    requirements: [
      "Portfolio demonstrating commercial web design projects",
      "Proficiency in Figma (components, auto-layout, variables)",
      "Strong understanding of conversion-focused design principles",
      "Experience designing for accessibility (WCAG 2.1)",
    ],
  },
  {
    title: "Content & Copywriter",
    type: "Contract / Part-time",
    location: "Remote — Worldwide",
    description:
      "Words matter as much as design. We need a copywriter who can turn a client's messy notes into clear, compelling website copy that drives action — without sounding generic.",
    requirements: [
      "Portfolio with website and landing page copy samples",
      "Experience writing for conversion, not just engagement",
      "Ability to match brand voice across different industries",
      "Understanding of basic SEO best practices",
    ],
  },
];

export function Careers() {
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
            Join the team
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Build the web with{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              people who care
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            We're a small, remote-first team of developers, designers, and strategists who love
            what they build. We work with interesting clients, ship fast, and take quality
            seriously.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.18 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Why Servio</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10">
            We keep things simple: great work, great people, no nonsense.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Open roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.28 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Open positions</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10">
            We hire on a project basis. All roles are remote and contract-based.
          </p>

          <div className="space-y-6">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {role.title}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Briefcase className="w-3.5 h-3.5" />
                        {role.type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {role.location}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:hello@servio.dev?subject=Application: ${encodeURIComponent(role.title)}`}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                  >
                    Apply now
                  </a>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                  {role.description}
                </p>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    What we're looking for
                  </h4>
                  <ul className="space-y-2">
                    {role.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Don't see a fit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.38 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/50 p-8 md:p-12 text-center"
        >
          <Clock className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Don't see the right role?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            We're always open to hearing from talented people. Send us a note with what you do and
            what kind of work you're looking for.
          </p>
          <a
            href="mailto:hello@servio.dev?subject=Open Application"
            className="inline-flex items-center px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Send an open application
          </a>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
