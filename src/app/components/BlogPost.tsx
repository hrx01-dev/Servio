import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Clock, Tag } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SEO } from "./SEO";
import { Aurora } from "./Aurora";
import { GlassPanel } from "./GlassPanel";
import { SectionFrame } from "./SectionFrame";
import { TempleDivider } from "./TempleDivider";
import { motion, useReducedMotion } from "motion/react";
import { posts } from "../lib/blogData";

const categoryColors: Record<string, string> = {
  Business: "bg-saffron/10 text-saffron border-saffron/20",
  Design: "bg-brand/10 text-brand border-brand/20",
  Performance: "bg-gold/10 text-gold border-gold/20",
  SEO: "bg-peacock/10 text-peacock border-peacock/20",
  Strategy: "bg-brand/10 text-brand border-brand/20",
  Copywriting: "bg-peacock/10 text-peacock border-peacock/20",
};

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const reduce = useReducedMotion();

  const post = posts.find((p) => p.slug === slug);
  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        ogType="article"
      />
      <Navbar />

      <main className="relative overflow-hidden pt-28 pb-24">
        <Aurora intensity={0.48} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,hsl(var(--background)/0.28)_48%,hsl(var(--background)/0.84)_100%)]"
        />

        <SectionFrame rails={false}>
          <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:border-brand/40 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </motion.div>

            <motion.header
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.55, delay: 0.08 }}
              className="mx-auto max-w-4xl pb-10 pt-14 md:pb-14 md:pt-16"
            >
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${categoryColors[post.category]}`}
                >
                  <Tag className="h-3 w-3" />
                  {post.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>

              <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {post.title}
              </h1>
              <p className="text-lede mt-6 max-w-3xl text-muted-foreground">
                {post.excerpt}
              </p>
            </motion.header>

            <TempleDivider className="mb-10 pt-0" />

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.2 }}
            >
              <GlassPanel tier="strong" className="rounded-2xl p-6 md:p-10 lg:p-12">
                <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
                  {post.body.map((block, i) => {
                    if (block.type === "h2") {
                      return (
                        <h2 key={i} className="!mb-4 !mt-10 text-2xl font-semibold md:text-3xl first:!mt-0">
                          {block.text}
                        </h2>
                      );
                    }
                    if (block.type === "p") {
                      return (
                        <p key={i} className="!mb-5">
                          {block.text}
                        </p>
                      );
                    }
                    if (block.type === "ul") {
                      return (
                        <ul key={i} className="mb-5 space-y-2 pl-5">
                          {block.items.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </div>
              </GlassPanel>
            </motion.article>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.35 }}
              className="mt-12"
            >
              <GlassPanel tier="strong" className="relative overflow-hidden rounded-2xl p-8 text-center md:p-12">
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
                <div className="relative">
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-gold">
                    Build what comes next
                  </span>
                  <h2 className="font-display mt-3 text-2xl font-semibold text-foreground md:text-3xl">
                    Ready to build something great?
                  </h2>
                  <p className="mx-auto mb-7 mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                    Get a free quote and see how Servio can help your business grow online.
                  </p>
                  <Link
                    to="/#contact"
                    className="bg-grad-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-elev-2 transition-all hover:-translate-y-0.5 hover:shadow-elev-3"
                  >
                    Get a Free Quote
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
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
