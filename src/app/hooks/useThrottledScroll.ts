import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for throttled scroll event handling
 * Prevents excessive re-renders and improves performance by limiting scroll callback frequency
 * @param callback - Function to call on throttled scroll event
 * @param delay - Throttle delay in milliseconds (default: 150ms)
 */
export function useThrottledScroll(
  callback: (scrollY: number) => void,
  delay: number = 150
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollRef = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const now = Date.now();

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If enough time has passed, call the callback immediately
    if (now - lastScrollRef.current >= delay) {
      lastScrollRef.current = now;
      callback(currentScrollY);
    } else {
      // Otherwise, schedule a call for later
      timeoutRef.current = setTimeout(() => {
        lastScrollRef.current = Date.now();
        callback(currentScrollY);
      }, delay - (now - lastScrollRef.current));
    }
  }, [callback, delay]);

  useEffect(() => {
    // Add scroll event listener with capture phase for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function - remove listener and clear any pending timeouts
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [handleScroll]);
}

/**
 * Alternative hook using requestAnimationFrame for even smoother throttling
 * Useful for animations or very frequent updates
 * @param callback - Function to call on throttled scroll event
 */
export function useRafThrottledScroll(
  callback: (scrollY: number) => void
): void {
  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule callback on next animation frame
    rafRef.current = requestAnimationFrame(() => {
      callback(window.scrollY);
      rafRef.current = null;
    });
  }, [callback]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleScroll]);
}
