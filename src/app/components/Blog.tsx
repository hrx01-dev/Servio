import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Clock, Tag } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";
import { posts } from "../lib/blogData";
import { SEO } from "./SEO";
import { Aurora } from "./Aurora";
import { GlassPanel } from "./GlassPanel";
import { SectionFrame } from "./SectionFrame";
import { TempleDivider } from "./TempleDivider";

const categoryColors: Record<string, string> = {
  Business: "bg-saffron/10 text-saffron border-saffron/20",
  Design: "bg-brand/10 text-brand border-brand/20",
  Performance: "bg-gold/10 text-gold border-gold/20",
  SEO: "bg-peacock/10 text-peacock border-peacock/20",
  Strategy: "bg-brand/10 text-brand border-brand/20",
  Copywriting: "bg-peacock/10 text-peacock border-peacock/20",
};

export function Blog() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Blog"
        description="Read the latest insights, tutorials, and news about web development, design, and growing your business online from the Servio team."
        canonical="/blog"
      />
      <Navbar />

      <main className="relative overflow-hidden pt-28 pb-24">
        <Aurora intensity={0.48} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,hsl(var(--background)/0.32)_48%,hsl(var(--background)/0.82)_100%)]"
        />

        <SectionFrame rails={false}>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:border-brand/40 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </motion.div>

            <motion.header
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.55, delay: 0.08 }}
              className="max-w-4xl pb-14 pt-16 md:pb-20 md:pt-20"
            >
              <div className="inline-flex items-center rounded-full border border-gold/30 bg-gold/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold shadow-sm">
                Insights & Resources
              </div>
              <h1 className="font-display mt-6 text-5xl font-semibold leading-[0.98] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                Ideas that move your business{" "}
                <span className="text-gradient-brand">forward.</span>
              </h1>
              <p className="text-lede mt-7 max-w-2xl text-muted-foreground">
                Practical advice on websites, growth, and online presence — written for founders and small business owners, not developers.
              </p>
            </motion.header>

            <TempleDivider className="mb-10 pt-0" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.18 }}
              className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6"
            >
              {posts.map((post, index) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                  <GlassPanel
                    as="article"
                    tier={index === 0 ? "strong" : "base"}
                    className={`relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand/35 group-hover:shadow-elev-3 md:p-7 ${
                      index === 0 ? "md:col-span-2 lg:min-h-[330px]" : ""
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-grad-brand opacity-60 transition-opacity group-hover:opacity-100"
                    />

                    <div className="mb-7 flex items-center justify-between gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${categoryColors[post.category]}`}
                      >
                        <Tag className="h-3 w-3" />
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2
                      className={`${
                        index === 0 ? "text-2xl md:text-3xl" : "text-xl"
                      } font-display font-semibold leading-tight text-foreground transition-colors group-hover:text-brand`}
                    >
                      {post.title}
                    </h2>
                    <p className="mt-4 max-w-3xl flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {post.excerpt}
                    </p>

                    <div className="mt-7 flex items-center justify-between gap-4 border-t border-border/60 pt-5">
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                        Read article
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.3 }}
              className="mt-16"
            >
              <GlassPanel tier="strong" className="relative overflow-hidden rounded-2xl p-8 text-center md:p-12">
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
                <div className="relative">
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-gold">
                    Stay in the loop
                  </span>
                  <h2 className="font-display mt-3 text-2xl font-semibold text-foreground md:text-3xl">
                    Get new articles in your inbox
                  </h2>
                  <p className="mx-auto mb-8 mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                    No spam. One email when we publish something worth reading.
                  </p>
                  <form
                    className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <label htmlFor="blog-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="blog-email"
                      type="email"
                      placeholder="you@company.com"
                      className="glass glass-thin min-w-0 flex-1 rounded-xl border border-border/70 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                    />
                    <button
                      type="submit"
                      className="bg-grad-brand rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-elev-2 transition-all hover:-translate-y-0.5 hover:shadow-elev-3"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </SectionFrame>
      </main>

      <Footer />
    </div>
  );
}
