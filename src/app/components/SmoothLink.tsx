import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scrollToSectionFromAnyRoute } from '../lib/scrollToSection';

interface SmoothLinkProps {
  /** The `id` of the target section to scroll to. */
  to: string;
  children: ReactNode;
  className?: string;
  /** Optional callback fired after the scroll is triggered (e.g. closing a mobile menu). */
  onClick?: () => void;
}

/**
 * A drop-in replacement for `<a href="#section-id">` that performs smooth
 * programmatic scrolling instead of a native anchor jump.
 *
 * Works from any route: if the user is not on `/`, it first navigates home
 * and then scrolls once the landing page has mounted.
 *
 * Renders as a plain `<button>` so it is keyboard-accessible and semantically
 * appropriate for in-page navigation actions.
 */
export function SmoothLink({ to, children, className, onClick }: SmoothLinkProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleClick = () => {
    onClick?.();
    scrollToSectionFromAnyRoute(to, navigate, pathname);
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
