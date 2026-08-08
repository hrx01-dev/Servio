import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Tag, ArrowUpRight } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";
import { posts } from "../lib/blogData";
import { SEO } from "./SEO";

const categoryColors: Record<string, string> = {
  Business: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Design: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Performance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  SEO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Strategy: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Copywriting: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

export function Blog() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SEO
        title="Blog"
        description="Read the latest insights, tutorials, and news about web development, design, and growing your business online from the Servio team."
        canonical="/blog"
      />
      <Navbar />

      <main className="relative overflow-hidden pt-28 pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-indigo-50/80 via-violet-50/30 to-transparent dark:from-indigo-950/30 dark:via-violet-950/10 dark:to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduce ? 0 : 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-14"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>

          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.55, delay: 0.08 }}
            className="max-w-3xl mb-16"
          >
            <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 shadow-sm backdrop-blur dark:border-indigo-800/60 dark:bg-slate-900/70 dark:text-indigo-400">
              Insights & Resources
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              Ideas that move your business <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">forward.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Practical advice on websites, growth, and online presence — written for founders and small business owners, not developers.
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7"
          >
            {posts.map((post, index) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className={`group relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-7 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-700 ${index === 0 ? "md:col-span-2 lg:min-h-[320px]" : ""}`}
              >
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category]}`}>
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className={`${index === 0 ? "text-2xl md:text-3xl" : "text-xl"} font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug max-w-3xl`}>
                  {post.title}
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed flex-1 max-w-3xl">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between gap-4 mt-7 pt-5 border-t border-gray-100 dark:border-slate-800">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{post.date}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Read article
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: 0.3 }}
            className="relative mt-16 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-center md:p-12 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/40"
          >
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Get new articles in your inbox
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                No spam. One email when we publish something worth reading.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="blog-email" className="sr-only">Email address</label>
                <input
                  id="blog-email"
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
