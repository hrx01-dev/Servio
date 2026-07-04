// ─────────────────────────────────────────────────────────────────────────────
// Vitest global setup (wired via `test.setupFiles` in vite.config.ts)
// ─────────────────────────────────────────────────────────────────────────────
// Registers jest-dom + the axe matcher, unmounts components between tests, and
// polyfills the browser APIs jsdom omits. None of the polyfills influence what
// axe evaluates — they only let animation / responsive / Radix-UI components
// mount without throwing, so the accessibility assertion can run.

import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import './a11y' // registers expect(...).toHaveNoViolations()

// React Testing Library mounts into document.body. Unmount + clear after every
// test so axe never scans DOM left over from a previous test.
afterEach(() => {
  cleanup()
})

// ── jsdom polyfills ──────────────────────────────────────────────────────────

// CSS media queries (dark mode, prefers-reduced-motion, responsive hooks).
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// IntersectionObserver / ResizeObserver power scroll-reveal + responsive layout.
class MockObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = MockObserver as unknown as typeof ResizeObserver
}

// requestAnimationFrame drives the motion / gsap timelines.
if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame
}

// Scroll / pointer-capture / canvas: no-ops jsdom hasn't implemented. The
// smooth-scroll layer and Radix UI call these during mount.
window.scrollTo = (() => {}) as typeof window.scrollTo
Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {})
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {})
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (typeof HTMLCanvasElement.prototype.getContext !== 'function') {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as typeof HTMLCanvasElement.prototype.getContext
}
