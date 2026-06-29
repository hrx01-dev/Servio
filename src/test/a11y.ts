// ─────────────────────────────────────────────────────────────────────────────
// axe-core accessibility runner + Vitest matcher
// ─────────────────────────────────────────────────────────────────────────────
// Wraps axe-core so a component test can assert it renders zero WCAG violations:
//
//   const { container } = renderWithProviders(<Footer />)
//   expect(await axeCheck(container)).toHaveNoViolations()
//
// A failing assertion prints every violation (rule, impact, help URL, and the
// offending element selectors) and exits non-zero, so a *new* violation fails
// the build in CI. See docs/accessibility-testing.md for scope + limitations.

import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Rules axe cannot evaluate inside jsdom (it has no layout/render engine), so
 * they are disabled to keep the suite deterministic rather than falsely green
 * or red:
 *
 * - `color-contrast` needs computed colours + geometry → real-browser only.
 * - `region` flags content sitting outside a landmark. That is a *page-level*
 *   concern and false-positives on isolated component fragments, so it is off
 *   by default; whole-page tests that render real <header>/<main>/<footer>
 *   landmarks re-enable it via the `options` argument.
 *
 * Colour contrast is intentionally out of scope for this static gate; it is
 * documented as a follow-up for a real-browser tool (Lighthouse / Playwright).
 */
const JSDOM_UNSUPPORTED_RULES: NonNullable<axe.RunOptions['rules']> = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
}

/**
 * Run axe against a rendered container (defaults to the whole document body).
 * Per-call `options.rules` are merged over the jsdom defaults, so a caller can
 * re-enable `region` for a full-page test or tighten the rule set further.
 */
export async function axeCheck(
  container: axe.ElementContext = document.body,
  options: axe.RunOptions = {},
): Promise<axe.AxeResults> {
  return axe.run(container, {
    ...options,
    rules: { ...JSDOM_UNSUPPORTED_RULES, ...options.rules },
  })
}

function formatViolations(violations: axe.Result[]): string {
  const blocks = violations.map((v) => {
    const targets = v.nodes
      .map((n) => {
        const selector = Array.isArray(n.target) ? n.target.join(' ') : String(n.target)
        const summary = (n.failureSummary ?? '').split('\n').map((l) => `         ${l}`).join('\n')
        return `       › ${selector}\n${summary}`
      })
      .join('\n')
    return `  • [${v.impact ?? 'n/a'}] ${v.id} — ${v.help}\n    ${v.helpUrl}\n${targets}`
  })
  return `Expected no accessibility violations but found ${violations.length}:\n\n${blocks.join('\n\n')}`
}

expect.extend({
  toHaveNoViolations(received: axe.AxeResults) {
    // Guard against the most likely authoring mistake on an async gate: a
    // forgotten `await` (or undefined). Without this, `received.violations` is
    // undefined → treated as "no violations" → the assertion passes vacuously,
    // silently disabling the check. Fail hard instead.
    if (received == null || !Array.isArray((received as Partial<axe.AxeResults>).violations)) {
      const kind =
        received instanceof Promise
          ? 'a Promise (did you forget to `await axeCheck(...)`?)'
          : `${received === null ? 'null' : typeof received}`
      return {
        pass: false,
        message: () => `toHaveNoViolations expected axe results but received ${kind}.`,
      }
    }
    const violations = received.violations
    const pass = violations.length === 0
    return {
      pass,
      actual: violations,
      message: () =>
        pass
          ? 'Expected accessibility violations, but the results were clean.'
          : formatViolations(violations),
    }
  },
})
