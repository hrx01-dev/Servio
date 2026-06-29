import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';
import { Smartphone, Zap } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { scrollToSection } from '../lib/scrollToSection';
import { GlassPanel } from './GlassPanel';
import { Aurora } from './Aurora';
import { MagneticButton } from './MagneticButton';
import { MandalaRing, ZariHairline, DevanagariEyebrow } from './motifs';
import { useInViewMount } from '../hooks/useInViewMount';
import { EASE, DUR } from '../lib/motion';
import { cn } from './ui/utils';

/* Headline split into words so they can rise + settle individually. Only the
   final word carries the brand-gradient accent. */
const HEADLINE: { t: string; accent?: boolean }[] = [
  { t: 'Your' },
  { t: 'Business' },
  { t: 'Deserves' },
  { t: 'a' },
  { t: 'Website' },
  { t: 'That' },
  { t: 'Converts', accent: true },
];

/* Self-rendered "glass dashboard" content — illustrative product UI that proves
   the craft. Tokens only, so it adapts to light + dark with no `dark:` forks. */
const KPIS: { label: string; to: number; suffix: string; dot: string }[] = [
  { label: 'Conversion', to: 42, suffix: '%', dot: 'bg-saffron' },
  { label: 'Avg. Speed', to: 98, suffix: '', dot: 'bg-peacock' },
  { label: 'Sessions', to: 24, suffix: 'k', dot: 'bg-gold' },
];

const BARS: { h: number; tone: 'brand' | 'gold' | 'peacock' }[] = [
  { h: 38, tone: 'brand' },
  { h: 58, tone: 'brand' },
  { h: 46, tone: 'peacock' },
  { h: 72, tone: 'brand' },
  { h: 54, tone: 'brand' },
  { h: 88, tone: 'gold' },
  { h: 66, tone: 'brand' },
];

const BAR_TONE: Record<'brand' | 'gold' | 'peacock', string> = {
  brand: 'bg-grad-brand',
  gold: 'bg-gold',
  peacock: 'bg-peacock',
};

/* Floating accent cards — kept for the pointer-parallax, now on glass with
   token-coloured chips. */
const FLOATING = [
  { icon: Smartphone, text: 'Mobile Responsive', chip: 'bg-peacock' },
  { icon: Zap, text: 'Fast Delivery', chip: 'bg-saffron' },
] as const;

/** rAF count-up — gated by reduced-motion and a `run` flag (mount when in view). */
function StatNumber({ to, suffix = '', run }: { to: number; suffix?: string; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduce) {
      setN(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const dur = 1300;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / dur, 1);
      setN(Math.round(to * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run, reduce]);

  return (
    <span className="nums-tabular">
      {n}
      {suffix}
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  // Centre (0.5, 0.5) so parallax transforms read zero offset before the first
  // pointer move — otherwise the mock/cards render shifted on initial paint.
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: mountRef, inView } = useInViewMount<HTMLDivElement>();

  // Subtle scroll parallax for the mock + mandala (transform-only; LCP-safe).
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -36]);
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 48]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const wordContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0 } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : '0.55em' },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: EASE.enter } },
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <Aurora intensity={0.6} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left: copy ─────────────────────────────────────────────── */}
          <div className="text-center lg:text-left" ref={mountRef}>
            {/* Availability pill */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : DUR.fast, ease: EASE.enter }}
            >
              <GlassPanel
                tier="thin"
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-peacock opacity-60 animate-ping motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-peacock" />
                </span>
                <span className="text-muted-foreground">Available for new projects</span>
              </GlassPanel>
            </motion.div>

            {/* Devanagari eyebrow */}
            <motion.div
              className="mt-6"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : DUR.fast, ease: EASE.enter, delay: reduce ? 0 : 0.08 }}
            >
              <DevanagariEyebrow hi="नमस्ते" en="Welcome to Servio" />
            </motion.div>

            {/* Headline — words rise + settle; only the accent word fades from
                gradient so the LCP text paints fast. */}
            <motion.h1
              variants={wordContainer}
              initial="hidden"
              animate="show"
              className="font-display text-display mt-4 mb-6 text-foreground"
            >
              {HEADLINE.map((w, i) => (
                <Fragment key={`${w.t}-${i}`}>
                  <motion.span
                    variants={word}
                    className={cn('inline-block', w.accent && 'text-gradient-brand')}
                  >
                    {w.t}
                  </motion.span>
                  {i < HEADLINE.length - 1 && ' '}
                </Fragment>
              ))}
            </motion.h1>

            <motion.p
              className="text-lede text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : DUR.base, ease: EASE.enter, delay: reduce ? 0 : 0.28 }}
            >
              We design and develop modern, fast, and scalable websites tailored to your business goals.
            </motion.p>

            {/* CTAs spring in */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 260, damping: 22, delay: 0.36 }
              }
            >
              <MagneticButton onClick={() => scrollToSection('contact')} className="px-8 py-4 shadow-elev-3">
                Get Free Quote
              </MagneticButton>
              <button
                onClick={() => scrollToSection('portfolio')}
                className="glass glass-strong inline-flex items-center justify-center rounded-full px-8 py-4 font-medium text-foreground transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
              >
                View Portfolio
              </button>
            </motion.div>

            {/* Stats — honest claims in glass chips. Zari hairline replaces the
                plain top border. */}
            <div className="mt-12 pt-8">
              <ZariHairline className="mb-8 opacity-80" />
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <GlassPanel tier="thin" className="rounded-xl px-3 py-4 text-center lg:text-left">
                  <div className="font-display text-2xl lg:text-3xl leading-tight text-gradient-brand">
                    <StatNumber to={100} suffix="%" run={inView} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Custom Code</div>
                </GlassPanel>
                <GlassPanel tier="thin" className="rounded-xl px-3 py-4 text-center lg:text-left">
                  <div className="font-display text-2xl lg:text-3xl leading-tight text-gradient-brand">
                    Mobile First
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Responsive Design</div>
                </GlassPanel>
                <GlassPanel tier="thin" className="rounded-xl px-3 py-4 text-center lg:text-left">
                  <div className="font-display text-2xl lg:text-3xl leading-tight text-gradient-brand">
                    SEO&#8209;Ready
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Built to Rank</div>
                </GlassPanel>
              </div>
            </div>
          </div>

          {/* ── Right: self-rendered glass dashboard mock ───────────────── */}
          <div className="relative">
            {/* Faint slowly-rotating mandala behind the mock */}
            {inView && (
              <motion.div
                aria-hidden
                style={{ y: mandalaY }}
                className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.13]"
              >
                <MandalaRing size={560} color="var(--gold)" />
              </motion.div>
            )}

            <motion.div style={{ y: mockY }} className="relative z-10">
              <div
                style={
                  reduce
                    ? undefined
                    : {
                        transform: `translate(${(mouse.x - 0.5) * 10}px, ${(mouse.y - 0.5) * 10}px)`,
                        transition: 'transform 0.2s ease-out',
                      }
                }
              >
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: reduce ? 0 : DUR.slow, ease: EASE.enter, delay: reduce ? 0 : 0.18 }}
                >
                <GlassPanel
                  tier="thick"
                  refract
                  data-hero-mock
                  className="relative overflow-hidden rounded-2xl p-3 sm:p-4 shadow-elev-4"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Sidebar rail */}
                    <div className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center gap-4 rounded-xl border border-border bg-foreground/[0.04] py-4">
                      <div className="h-7 w-7 rounded-lg bg-grad-brand shadow-elev-1" />
                      <div className="flex flex-col items-center gap-3 pt-1">
                        <span className="h-2.5 w-2.5 rounded-md bg-gold" />
                        <span className="h-2.5 w-2.5 rounded-md bg-foreground/20" />
                        <span className="h-2.5 w-2.5 rounded-md bg-foreground/20" />
                        <span className="h-2.5 w-2.5 rounded-md bg-foreground/20" />
                      </div>
                      <div className="mt-auto h-6 w-6 rounded-full bg-foreground/15" />
                    </div>

                    {/* Main column */}
                    <div className="flex-1 min-w-0">
                      {/* Header bar */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-saffron" />
                            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                            <span className="h-2.5 w-2.5 rounded-full bg-peacock" />
                          </div>
                          <span className="hidden sm:block h-2.5 w-24 rounded-full bg-foreground/15" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-24 rounded-full border border-border bg-foreground/[0.04]" />
                          <span className="h-6 w-6 rounded-full bg-grad-brand" />
                        </div>
                      </div>

                      {/* KPI chips */}
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                        {KPIS.map((k) => (
                          <GlassPanel key={k.label} tier="thin" className="rounded-xl p-2.5 sm:p-3">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('h-1.5 w-1.5 rounded-full', k.dot)} />
                              <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                                {k.label}
                              </span>
                            </div>
                            <div className="mt-1.5 font-display text-lg sm:text-xl leading-none text-foreground">
                              <StatNumber to={k.to} suffix={k.suffix} run={inView} />
                            </div>
                          </GlassPanel>
                        ))}
                      </div>

                      {/* Chart card */}
                      <div className="mt-3 rounded-xl border border-border bg-foreground/[0.03] p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="h-2 w-16 rounded-full bg-foreground/15" />
                          <span className="h-2 w-10 rounded-full bg-peacock/50" />
                        </div>
                        <div className="flex h-24 sm:h-28 items-end gap-1.5 sm:gap-2">
                          {BARS.map((b, i) => (
                            <motion.div
                              key={i}
                              className={cn('flex-1 origin-bottom rounded-t-md', BAR_TONE[b.tone])}
                              style={{ height: `${b.h}%` }}
                              initial={reduce ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              transition={{
                                duration: reduce ? 0 : 0.5,
                                ease: EASE.enter,
                                delay: reduce ? 0 : 0.5 + i * 0.06,
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-3">
                          <ZariHairline className="opacity-60" />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
                </motion.div>
              </div>

              {/* Floating accent cards — pointer parallax preserved */}
              {FLOATING.map((card, index) => {
                const mult = reduce ? 0 : index === 0 ? 9 : -9;
                const px = (mouse.x - 0.5) * mult;
                const py = (mouse.y - 0.5) * mult;
                return (
                  <div
                    key={card.text}
                    className={cn(
                      'absolute z-20 hidden lg:block',
                      index === 0 ? 'top-6 -left-6' : 'bottom-8 -right-6',
                    )}
                    style={{
                      transform: `translate(${px}px, ${py}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: reduce ? 0 : DUR.base,
                        ease: EASE.enter,
                        delay: reduce ? 0 : 0.55 + index * 0.12,
                      }}
                    >
                      <GlassPanel
                        tier="strong"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-elev-3"
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white',
                            card.chip,
                          )}
                        >
                          <card.icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <span className="whitespace-nowrap text-sm font-medium text-foreground">
                          {card.text}
                        </span>
                      </GlassPanel>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
