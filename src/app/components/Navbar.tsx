import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
import { toast } from 'sonner';
import { useThrottledScroll } from '../hooks/useThrottledScroll';
import { useTheme } from '../hooks/useTheme';
import { useMagnetic } from '../hooks/useMagnetic';
import { useAuth } from '../../Firebase/useAuth';
import { useAdmin } from '../../admin/context/useAdmin';
import { scrollToSectionFromAnyRoute } from '../lib/scrollToSection';
import { EASE } from '../lib/motion';
import { KolamDots } from './motifs';
import { cn } from './ui/utils';

/** The landing-page sections the in-page nav links point at. */
const NAV_LINKS = [
  { id: 'hero', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact' },
] as const;

/** Brand CTA — liquid-glass pill with a diya (gold) hover glow. */
const PRIMARY_CTA =
  'relative inline-flex items-center justify-center rounded-full bg-grad-brand px-5 py-2.5 text-sm font-medium text-white shadow-elev-1 transition-[transform,box-shadow] duration-300 will-change-transform hover:[box-shadow:0_0_28px_-4px_var(--gold)] active:scale-95';

/** 8-fold lotus / jali monogram — engraved copper → brass, geometry not iconography. */
function LotusMark() {
  const raw = useId().replace(/[:]/g, '');
  const gid = `lotus-${raw}`;
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:rotate-45"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--copper)" />
          <stop offset="0.55" stopColor="var(--brass-deep)" />
          <stop offset="1" stopColor="var(--brass)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" stroke={`url(#${gid})`} strokeWidth="1" opacity="0.35" />
      <g stroke={`url(#${gid})`} strokeWidth="1.5" strokeLinejoin="round">
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d="M20 5 C 25 11, 25 16, 20 20 C 15 16, 15 11, 20 5 Z"
            transform={`rotate(${i * 45} 20 20)`}
          />
        ))}
      </g>
      <circle cx="20" cy="20" r="3" fill={`url(#${gid})`} />
    </svg>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('hero');
  const { isDarkMode, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'Dashboard';
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const onLanding = location.pathname === '/';

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Magnetic pull on the primary CTA (no-ops on touch / reduced-motion).
  const { ref: ctaRef, onPointerMove, onPointerLeave } = useMagnetic<HTMLAnchorElement>(0.2);

  // Detach the bar into the floating capsule once past ~24px.
  useThrottledScroll((scrollY) => {
    setIsScrolled(scrollY > 24);
  }, 150);

  // Bottom-edge scroll-progress hairline (spring-smoothed unless reduced-motion).
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const progressScaleX = reduce ? scrollYProgress : smoothProgress;

  // Track the active landing section so the layoutId pill can glide under it.
  useEffect(() => {
    if (!onLanding) {
      setActiveId('');
      return;
    }
    const els = NAV_LINKS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onLanding]);

  // Mobile menu: trap focus while open, close (restoring focus to the toggle)
  // on Escape, and focus the first item on open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const menu = mobileMenuRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      // Keep Tab focus inside the open menu so it can't reach the obscured page.
      if (e.key === 'Tab' && menu) {
        const f = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    menu?.querySelector<HTMLElement>('a, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  // Close the mobile menu and return focus to the toggle (used by close paths).
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const handleSignOut = async () => {
    try {
      // Dynamic import keeps the Auth SDK out of the landing bundle (#234);
      // by the time a user can sign out, AuthContext has already loaded it,
      // so this resolves from the module cache.
      const { auth } = await import('../../Firebase/auth');
      await auth.signOut();
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      // Covers both the chunk fetch (offline) and the sign-out call. The menu
      // stays open so the user can retry from where they were.
      console.error('Error signing out: ', error);
      toast.error("Couldn't sign out. Please check your connection and try again.");
    }
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    scrollToSectionFromAnyRoute(id, navigate, location.pathname);
  };

  // At the very top the capsule is near-transparent and shadowless; scrolled it
  // becomes a frosted, elevated glass-strong surface.
  const capsuleStyle = isScrolled
    ? undefined
    : ({ ['--glass-bg']: 'transparent', ['--glass-shadow']: 'none' } as React.CSSProperties);

  return (
    <nav aria-label="Primary" className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3">
      {/* Floating centered liquid-glass capsule */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -16, scale: 0.96 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: isScrolled ? 1 : 0.99 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 28, mass: 0.8 }}
        style={capsuleStyle}
        className={cn(
          'glass pointer-events-auto relative mx-auto w-[min(96%,72rem)] overflow-hidden rounded-full',
          'transition-[background-color,box-shadow] duration-300',
          isScrolled ? 'glass-strong' : 'glass-thin',
        )}
      >
        {/* One motif, at the edge: a faint kolam dot-field fading in from the right */}
        <KolamDots
          className="absolute inset-y-0 right-0 w-40 [mask-image:linear-gradient(to_right,transparent,black)]"
          size={18}
          color="var(--gold)"
          opacity={0.22}
        />

        <div className="relative flex h-14 items-center justify-between gap-3 px-3 sm:px-4 md:h-16">
          {/* Logo: lotus monogram + wordmark */}
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="group flex flex-shrink-0 items-center gap-2 rounded-full"
            aria-label="Servio — back to top"
          >
            <LotusMark />
            <span className="text-gradient-brand font-display text-xl font-semibold tracking-tight">
              Servio
            </span>
          </button>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ id, label }) => {
              const active = onLanding && activeId === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  aria-current={active ? 'page' : undefined}
                  className="relative rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-inset ring-gold/40"
                      transition={
                        reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                  <span
                    className={cn(
                      'relative',
                      active ? 'text-foreground' : 'text-foreground/65 hover:text-foreground',
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Theme toggle + auth (desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-foreground/5"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-gold" /> : <Moon className="h-5 w-5" />}
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2">
                {adminLoading ? (
                  <span className={cn(PRIMARY_CTA, 'cursor-wait opacity-60')}>Dashboard</span>
                ) : (
                  <Link
                    ref={ctaRef}
                    onPointerMove={onPointerMove}
                    onPointerLeave={onPointerLeave}
                    to={dashboardPath}
                    className={PRIMARY_CTA}
                  >
                    {dashboardLabel}
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                ref={ctaRef}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                to="/signin"
                className={PRIMARY_CTA}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Theme toggle + menu button (mobile) */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-foreground/5"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-gold" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-foreground/5"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Bottom-edge scroll-progress hairline (gold → brand) */}
        <motion.div
          aria-hidden
          style={{
            scaleX: progressScaleX,
            background: 'linear-gradient(90deg, var(--gold), var(--primary))',
          }}
          className="absolute inset-x-4 bottom-1 h-px origin-left rounded-full"
        />
      </motion.div>

      {/* Mobile menu — glass sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={closeMobileMenu}
              className="pointer-events-auto fixed inset-0 -z-10 cursor-default bg-black/20 backdrop-blur-[1px] md:hidden"
            />
            <motion.div
              id="mobile-menu"
              ref={mobileMenuRef}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.22, ease: EASE.exit }}
              className="glass glass-strong pointer-events-auto mx-auto mt-2 w-[min(96%,72rem)] overflow-hidden rounded-3xl p-2 md:hidden"
            >
              <div className="space-y-1">
                {NAV_LINKS.map(({ id, label }) => {
                  const active = onLanding && activeId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => scrollToSection(id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block w-full rounded-2xl px-4 py-2.5 text-left text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/15 text-foreground ring-1 ring-inset ring-gold/40'
                          : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 space-y-2 border-t border-border/60 pt-2">
                {currentUser ? (
                  <>
                    {adminLoading ? (
                      <span className={cn(PRIMARY_CTA, 'w-full cursor-wait justify-center opacity-60')}>
                        Dashboard
                      </span>
                    ) : (
                      <Link
                        to={dashboardPath}
                        onClick={closeMobileMenu}
                        className={cn(PRIMARY_CTA, 'w-full justify-center')}
                      >
                        {dashboardLabel}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    onClick={closeMobileMenu}
                    className={cn(PRIMARY_CTA, 'w-full justify-center')}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
