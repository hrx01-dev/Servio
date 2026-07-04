// Type augmentation that teaches Vitest's `expect` about the custom axe matcher
// registered in src/test/a11y.ts. (jest-dom's own matchers are augmented by its
// `@testing-library/jest-dom/vitest` import in src/test/setup.ts.)

import 'vitest'

interface A11yMatchers<R = unknown> {
  /** Passes when the given axe results contain zero accessibility violations. */
  toHaveNoViolations(): R
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends A11yMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends A11yMatchers {}
}
