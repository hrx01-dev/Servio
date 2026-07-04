import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
} from 'motion/react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { usePublishedPortfolio } from '../hooks/usePortfolio';
import { deriveCategories, type PortfolioProject } from '../lib/portfolio';
import { GlassPanel } from './GlassPanel';
import { Aurora } from './Aurora';
import { Reveal } from './motion/Reveal';
import { EASE, DUR } from '../lib/motion';
import { useMagnetic } from '../hooks/useMagnetic';
import { cn } from './ui/utils';

const TILT_SPRING = { stiffness: 200, damping: 20, mass: 0.5 } as const;

const PILL =
  'inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/15';

/** Pointer-driven 3D tilt and scroll parallax are disabled on touch screens. */
function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

/** Only allow http(s) destinations — guards against javascript:/data: hrefs. */
function isSafeHttpUrl(u: string): boolean {
  try {
    const proto = new URL(u).protocol;
    return proto === "http:" || proto === "https:";
  } catch {
    return false;
  }
}

/** A magnetic "View Project" affordance that keeps real anchor semantics. */
function ViewProjectLink({ url, label }: { url: string; label: string }) {
  const mag = useMagnetic<HTMLAnchorElement>(0.35);
  if (!url || !isSafeHttpUrl(url)) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium opacity-60">
        Coming Soon
      </span>
    );
  }
  return (
    <a
      ref={mag.ref}
      onPointerMove={mag.onPointerMove}
      onPointerLeave={mag.onPointerLeave}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View project: ${label}`}
      className="group/btn inline-flex items-center gap-2 rounded-full bg-grad-brand px-5 py-2.5 text-sm font-semibold text-white shadow-elev-2 transition-[box-shadow] duration-300 will-change-transform hover:[box-shadow:0_0_24px_-4px_var(--gold)]"
    >
      View Project
      <ExternalLink
        className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  );
}

interface ProjectCardProps {
  project: PortfolioProject;
  index: number;
  reduce: boolean;
  featured?: boolean;
  className?: string;
}

function ProjectCard({ project, index, reduce, featured = false, className }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Pointer-driven 3D tilt (springy), centred at rest.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const tilt = featured ? 6 : 9;
  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), TILT_SPRING);

  // Gentle scroll parallax on the media.
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'end start'] });
  const parallax = useTransform(scrollYProgress, [0, 1], featured ? [-28, 28] : [-18, 18]);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || isCoarsePointer()) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const media = project.imageUrl ? (
    <motion.img
      src={project.imageUrl}
      alt={project.title}
      loading="lazy"
      style={{ y: reduce ? 0 : parallax, scale: reduce ? 1 : 1.15 }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
      <ImageOff className="h-10 w-10" aria-hidden="true" />
    </div>
  );

  return (
    <motion.div
      className={cn('h-full', className)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : DUR.base, delay: reduce ? 0 : index * 0.06, ease: EASE.enter }}
    >
      <motion.div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        className="h-full [transform-style:preserve-3d] will-change-transform"
      >
        {featured ? (
          /* ── Featured tile: a jali "reveal" over full-bleed media ──────── */
          <div className="relative h-full min-h-[440px] overflow-hidden rounded-[var(--radius)] bg-foreground/[0.04] lg:min-h-[560px]">
            {media}
            {/* The carved jali screen — blur shows only through the lattice. */}
            <div aria-hidden className="glass glass-thick jali-mask absolute inset-0 opacity-60" />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
            />
            <GlassPanel
              tier="strong"
              className="absolute inset-x-3 bottom-3 p-5 sm:inset-x-4 sm:bottom-4 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={PILL}>{project.category}</span>
                {project.industry && (
                  <span className="text-xs opacity-70">{project.industry}</span>
                )}
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                {project.title}
              </h3>
              {project.description && (
                <p className="mt-2 line-clamp-2 text-sm opacity-80">{project.description}</p>
              )}
              {project.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border bg-foreground/[0.03] px-2 py-1 text-[10px] font-medium opacity-70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-5">
                <ViewProjectLink url={project.projectUrl} label={project.title} />
              </div>
            </GlassPanel>
          </div>
        ) : (
          /* ── Standard glass card ──────────────────────────────────────── */
          <GlassPanel
            tier="base"
            className="group relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-elev-3"
          >
            <div className="relative h-44 overflow-hidden bg-foreground/[0.04] sm:h-48">
              {media}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={PILL}>{project.category}</span>
                {project.industry && (
                  <span className="text-xs opacity-60">{project.industry}</span>
                )}
              </div>
              <h3 className="mb-3 text-lg font-semibold">{project.title}</h3>
              {project.technologies.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border bg-foreground/[0.03] px-2 py-1 text-[10px] font-medium opacity-70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto">
                <ViewProjectLink url={project.projectUrl} label={project.title} />
              </div>
            </div>
          </GlassPanel>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Portfolio() {
  const reduce = useReducedMotion();
  const { projects, loading } = usePublishedPortfolio();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = deriveCategories(projects);
  // If the active filter no longer exists (data changed), fall back to "All".
  const effectiveCategory = categories.includes(activeCategory) ? activeCategory : 'All';
  const filteredProjects =
    effectiveCategory === 'All'
      ? projects
      : projects.filter((project) => project.category === effectiveCategory);

  const [featuredProject, ...restProjects] = filteredProjects;

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-title"
      className="relative overflow-hidden bg-background py-20 md:py-32"
    >
      {/* Sandstone paper-grain — tactile stone, barely-there in both modes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <Aurora intensity={0.5} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 text-center sm:mb-16">
          <span className="eyebrow text-primary">What We Build</span>
          <h2
            id="portfolio-title"
            className="mt-3 mb-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Portfolio <span className="text-gradient-brand">Showcase</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Real projects we have built — from AI-powered SaaS platforms to business websites and
            e-commerce stores.
          </p>
        </Reveal>

        {loading ? (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-3"
            role="status"
            aria-label="Loading portfolio"
          >
            <GlassPanel className="min-h-[440px] animate-pulse sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:min-h-[560px]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <GlassPanel key={i} className="min-h-[260px] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Our showcase is coming soon — check back shortly.
          </p>
        ) : (
          <>
            {/* Filter Tabs — a single layoutId pill slides under the active one. */}
            <div className="mb-12 flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((category) => {
                const active = effectiveCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={active}
                    className={cn(
                      'relative isolate rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300',
                      active ? 'text-white' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="portfolio-filter-pill"
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-grad-brand shadow-elev-2"
                        transition={
                          reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }
                        }
                      />
                    )}
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Bento grid — one large featured tile + smaller glass cards. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={effectiveCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : DUR.fast }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-3"
              >
                {featuredProject && (
                  <ProjectCard
                    key={featuredProject.id}
                    project={featuredProject}
                    index={0}
                    reduce={!!reduce}
                    featured
                    className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
                  />
                )}
                {restProjects.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={i + 1}
                    reduce={!!reduce}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}
