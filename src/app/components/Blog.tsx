import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";

const posts = [
  {
    slug: "why-your-small-business-needs-a-website",
    category: "Business",
    title: "Why Your Small Business Needs a Website in 2025",
    excerpt:
      "75% of consumers judge a company's credibility based on its website. Here's why not having one is costing you clients — and how to fix it without breaking the bank.",
    date: "June 10, 2025",
    readTime: "5 min read",
  },
  {
    slug: "landing-page-mistakes",
    category: "Design",
    title: "7 Landing Page Mistakes That Kill Conversions",
    excerpt:
      "A beautiful page that doesn't convert is just art. We reviewed 200+ small-business landing pages and found the same errors over and over. Here's how to avoid them.",
    date: "May 28, 2025",
    readTime: "7 min read",
  },
  {
    slug: "page-speed-revenue",
    category: "Performance",
    title: "How Page Speed Directly Impacts Your Revenue",
    excerpt:
      "Every 1-second delay in load time can cut conversions by 7%. We break down the real numbers and show you exactly how to make your site faster.",
    date: "May 14, 2025",
    readTime: "6 min read",
  },
  {
    slug: "seo-basics-small-business",
    category: "SEO",
    title: "SEO Basics Every Small Business Owner Should Know",
    excerpt:
      "You don't need to hire an agency to rank on Google. These fundamentals — metadata, structured content, and core web vitals — will get you most of the way there.",
    date: "April 30, 2025",
    readTime: "8 min read",
  },
  {
    slug: "ecommerce-vs-booking-site",
    category: "Strategy",
    title: "E-Commerce vs. Booking Site: Which Do You Need?",
    excerpt:
      "They look similar but serve very different purposes. We compare the two options, walk through the costs, and help you pick the right model for your business.",
    date: "April 15, 2025",
    readTime: "5 min read",
  },
  {
    slug: "content-that-converts",
    category: "Copywriting",
    title: "Writing Website Copy That Actually Converts",
    excerpt:
      "Most websites talk about themselves. The best ones talk about the customer. Learn the simple framework we use to write copy that turns visitors into leads.",
    date: "March 31, 2025",
    readTime: "6 min read",
  },
];

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
          className="mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">
            Insights & Resources
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            The Servio{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Practical advice on websites, growth, and online presence — written for founders and
            small business owners, not developers.
          </p>
        </motion.div>

        {/* Posts grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category]}`}
                >
                  <Tag className="w-3 h-3" />
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1 mb-5">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-400 dark:text-gray-500">{post.date}</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  Read article →
                </span>
              </div>
            </article>
          ))}
        </motion.div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/50 p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Get new articles in your inbox
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            No spam. One email when we publish something worth reading.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
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
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
