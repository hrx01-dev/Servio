import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { services } from '../data/servicesData';
import { TypingText } from './TypingText';

// Fine fractal-noise grain to kill blur banding on the light backdrop. Fully
// percent-encoded so the data URI survives any bundler / CSS parser.
const grainStyle: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  backgroundSize: '120px',
};

// Masked 1px gradient ring (the glass rim). Inline so the mask-composite +
// -webkit- companion are emitted deterministically across engines.
const ringStyle: React.CSSProperties = {
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
};

function ServiceCard({
  service,
  index,
  reduce,
}: {
  service: (typeof services)[number];
  index: number;
  reduce: boolean | null;
}) {
  const Icon = service.icon;

  // Cursor-tracked spotlight via CSS vars — paint-only, off the React render path.
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <Link to={`/services/${service.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-3xl">
    <motion.div
      onMouseMove={onMove}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduce ? 0 : 0.6, delay: index * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={reduce ? undefined : { y: -10 }}
      className="group relative overflow-hidden rounded-3xl p-8 cursor-pointer bg-white/55 dark:bg-slate-900/55 hover:bg-white/[0.65] dark:hover:bg-slate-800/[0.65] backdrop-blur-2xl backdrop-saturate-150 border border-white/60 dark:border-slate-700/60 shadow-[0_8px_32px_-8px_rgba(79,70,229,0.25),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_24px_60px_-12px_rgba(124,58,237,0.45)] dark:hover:shadow-[0_24px_60px_-12px_rgba(124,58,237,0.3)] transition-[background-color,box-shadow] duration-300"
    >
      {/* Accent glaze — each card refracts its own hue */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${service.color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500`}
      />

      {/* Masked 1px gradient rim */}
      <div
        aria-hidden
        style={ringStyle}
        className="pointer-events-none absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-white/80 via-white/20 to-indigo-200/50 dark:from-white/20 dark:via-slate-400/10 dark:to-indigo-300/20"
      />

      {/* Cursor-following radial spotlight */}
      <div
        aria-hidden
        style={{
          background:
            'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(124,58,237,0.18), transparent 60%)',
        }}
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* One-shot diagonal light sweep on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl motion-reduce:hidden"
      >
        <div className="absolute -inset-y-1/2 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent -translate-x-full group-hover:translate-x-[500%] transition-transform duration-700 ease-out" />
      </div>

      {/* Editorial index badge */}
      <span
        aria-hidden
        className="absolute top-5 right-6 text-xs font-semibold tracking-widest text-indigo-400/70 dark:text-indigo-300/70 select-none"
      >
        0{index + 1}
      </span>

      <div className="relative z-10">
        {/* Glowing glass icon chip */}
        <div className="relative mb-6 w-14 h-14">
          <div
            aria-hidden
            className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${service.color} opacity-40 blur-xl group-hover:opacity-70 transition-opacity duration-500`}
          />
          <div
            className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} ring-1 ring-white/40 dark:ring-white/20 shadow-lg flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 will-change-transform`}
          >
            <span
              aria-hidden
              className="absolute inset-x-1 top-1 h-1/2 rounded-t-xl bg-gradient-to-b from-white/50 to-transparent"
            />
            <Icon className="relative w-7 h-7 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{service.title}</h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{service.description}</p>

        <div className="mt-6 flex items-center font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span className="text-sm">Learn more</span>
          <svg
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}

export function Services() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  const lineScale = useTransform(scrollYProgress, [0.05, 0.22], [0, 1]);

  return (
    <section
      ref={ref}
      id="services"
      className="relative isolate overflow-hidden py-20 md:py-32 bg-white dark:bg-slate-950"
    >
      {/* Base wash — gives the frost something colored to refract, fades into neighbors */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-indigo-50/40 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950"
      />

      {/* Aurora parallax wrapper — a single transform drives all three blobs */}
      <motion.div
        aria-hidden
        style={{ y: reduce ? 0 : bgY, scale: reduce ? 1 : bgScale }}
        className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
      >
        <motion.div
          className="absolute -top-32 -left-24 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-400/30 dark:from-indigo-500/20 dark:to-purple-500/15 blur-3xl"
          animate={reduce ? undefined : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-[-120px] w-[560px] h-[560px] rounded-full bg-gradient-to-br from-purple-400/35 to-fuchsia-300/25 dark:from-purple-500/15 dark:to-fuchsia-400/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, -50, 30, 0], y: [0, 25, -15, 0], scale: [1, 1.06, 0.97, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-160px] left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-300/25 dark:from-cyan-500/15 dark:to-teal-400/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, 30, -40, 0], y: [0, -20, 30, 0], scale: [1, 1.07, 0.95, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Grain to kill banding */}
      <div aria-hidden style={grainStyle} className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            Our Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Everything You Need to{' '}
            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(110deg,#4F46E5,#7C3AED,#06B6D4,#7C3AED,#4F46E5)',
                backgroundSize: '200% auto',
              }}
              animate={reduce ? undefined : { backgroundPositionX: ['0%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <TypingText text="Succeed Online" delay={200} cursorColor="bg-indigo-500" />
            </motion.span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From landing pages to complex web applications, we deliver solutions that drive results.
          </p>

          {/* Self-drawing underline tied to scroll progress */}
          <motion.div
            aria-hidden
            style={{ scaleX: reduce ? 1 : lineScale }}
            className="mx-auto mt-5 h-[3px] w-40 origin-left rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500"
          />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}
