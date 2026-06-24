import { useState, useEffect, useRef } from 'react';
import { useReducedMotion, useInView } from 'motion/react';

interface TypingTextProps {
  text: string;
  /** Milliseconds to wait before typing starts */
  delay?: number;
  /** Milliseconds per character */
  speed?: number;
  /** Wait for the element to enter the viewport before starting */
  triggerOnView?: boolean;
  /** Show blinking cursor while typing */
  showCursor?: boolean;
  /** Tailwind bg-* class for the cursor bar colour */
  cursorColor?: string;
}

/**
 * Renders text character-by-character with a blinking cursor.
 * Stops animating once all characters are displayed.
 * Respects prefers-reduced-motion — shows the full string instantly when set.
 * Screen readers receive the complete text via aria-label at all times.
 */
export function TypingText({
  text,
  delay = 0,
  speed = 55,
  triggerOnView = true,
  showCursor = true,
  cursorColor = 'bg-indigo-500',
}: TypingTextProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' });

  const [displayed, setDisplayed] = useState(reduce ? text : '');
  const [done, setDone] = useState(!!reduce);
  const [blink, setBlink] = useState(true);

  const shouldStart = triggerOnView ? isInView : true;

  useEffect(() => {
    if (reduce) return;
    if (!shouldStart) return;

    setDisplayed('');
    setDone(false);

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        if (cancelled) { clearInterval(intervalId); return; }
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(intervalId);
          if (!cancelled) setDone(true);
        }
      }, speed);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [shouldStart, text, delay, speed, reduce]);

  useEffect(() => {
    if (done || reduce) { setBlink(false); return; }
    const id = setInterval(() => setBlink((v) => !v), 530);
    return () => clearInterval(id);
  }, [done, reduce]);

  if (reduce) {
    return <span ref={ref}>{text}</span>;
  }

  return (
    <span ref={ref} aria-label={text}>
      <span aria-hidden="true">{displayed}</span>
      {showCursor && !done && (
        <span
          aria-hidden="true"
          className={`inline-block w-[2px] h-[0.85em] align-text-bottom ml-[1px] rounded-sm ${cursorColor} transition-opacity duration-75 ${
            blink ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </span>
  );
}
