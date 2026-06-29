# Accessibility Testing

Servio runs automated accessibility checks on every push and pull request, so a
new WCAG violation fails the build before it can ship. The checks use
[axe-core](https://github.com/dequelabs/axe-core) — the same engine behind the
axe browser extension and Lighthouse's accessibility audit — driven from the
existing [Vitest](https://vitest.dev/) + Testing Library suite.

## What runs, and where

| | |
| --- | --- |
| **Engine** | `axe-core` (WCAG 2.1 A/AA rule set) |
| **Runner** | Vitest (`jsdom` environment) + `@testing-library/react` |
| **Specs** | `src/test/a11y/*.a11y.test.tsx` |
| **CI** | `.github/workflows/ci.yml` — the **Accessibility (axe-core)** job, plus the `Test` step of the **verify** job |

> **Enforcement note:** a failing check only *blocks a merge* once it is added
> to the required status checks for `main` (Settings → Branches / Rulesets).
> Until then the red check is advisory.

Each spec renders a component or page in isolation (wrapped in the app's router /
theme / helmet / admin providers via `renderWithProviders`) and asserts that
axe finds zero violations:

```tsx
import { renderWithProviders } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'

it('Footer has no axe violations', async () => {
  const { container } = renderWithProviders(<Footer />)
  expect(await axeCheck(container)).toHaveNoViolations()
})
```

When axe finds a problem the assertion prints the rule, its impact, a link to
the Deque rule reference, and the offending element selectors, then exits
non-zero — which is what fails CI.

## Running locally

```bash
npm run test:a11y       # just the accessibility specs
npm test                # the whole suite (accessibility included)
npm run test:watch      # watch mode while fixing a violation
```

## Coverage

Gated today (every push / PR):

- **Whole-page structure** — an assembled page (`PrivacyPolicy`: Navbar +
  `<main>` + Footer) scanned at the document level with the landmark/`region`,
  single-`<h1>`, heading-order, and `html-has-lang` rules enabled. This is what
  catches missing landmarks and cross-section heading skips.
- **Navigation** — `Navbar`, in both its default state and with the mobile menu
  open (its nav links + close button).
- **Landing sections** — `Hero`, `TrustedBy`, `Services`, `Process`,
  `WhyChoose`, `Testimonials`, `FinalCTA`, `FAQ`, `Pricing`, `QuoteForm`, and
  `Portfolio` (its loaded grid, via a mocked data hook).
- **Content pages** — `Footer`, `NotFound`, `About`, `Careers`, `Blog`,
  `PrivacyPolicy`, `TermsOfService`, `CookiePolicy`.

**Not yet gated** — regressions here will *not* fail the build: `BlogPost`,
`ServiceDetailPage`, `SignIn`, `SignUp`, and the authenticated dashboard / admin
areas; non-default interactive states other than the Navbar menu (open dialogs,
expanded accordions); plus the rules called out under *Scope & limitations*.

## Scope & limitations

axe runs inside `jsdom`, which has **no layout or rendering engine**. Two
families of rules can't be evaluated reliably there and are disabled in
`src/test/a11y.ts`:

- **`color-contrast`** — needs computed colours and geometry. Contrast is a
  real concern for the design; it should be verified with a real-browser tool
  (Lighthouse CI or `@axe-core/playwright`) as a follow-up. This static gate
  intentionally does **not** claim to cover it.
- **`region`** (content-outside-a-landmark) — a *page-level* concern that
  false-positives on isolated component fragments, so it is off by default for
  the component specs. The whole-page spec (`pages.a11y.test.tsx`) re-enables it
  (together with `html-has-lang`) for a real `<header>`/`<main>`/`<footer>`
  page.

Two more caveats:

- **Document-level rules** (`region`, `landmark-one-main`, `page-has-heading-one`,
  `html-has-lang`) only run in the whole-page spec, because the component specs
  scan an isolated fragment, not the whole document.
- **axe `incomplete` results are not enforced.** In jsdom some checks can't be
  decided definitively and axe parks them as "needs review" rather than
  violations; only definite violations fail the build.

Everything else axe checks statically runs in every spec: image `alt` text,
form-control labels, accessible names for buttons/links, valid and permitted
ARIA, per-fragment heading order, list structure, and duplicate IDs.

## Adding a test

1. Add a case to an existing `src/test/a11y/*.a11y.test.tsx` file (or create a
   new one **under `src/test/a11y/`** — `npm run test:a11y` only runs that
   directory; the full `npm test` would still pick up a spec elsewhere, but the
   dedicated a11y job would not).
2. Render with `renderWithProviders(...)` and assert
   `expect(await axeCheck(container)).toHaveNoViolations()`.
3. If a component needs async data to render its real markup (e.g. `Portfolio`),
   `vi.mock` its data hook to return sample data — see
   `src/test/a11y/portfolio.a11y.test.tsx`.

## Shared harness

- `src/test/setup.ts` — registers the matcher + jest-dom and polyfills the
  browser APIs jsdom omits (`matchMedia`, `IntersectionObserver`,
  `ResizeObserver`, `requestAnimationFrame`, canvas, pointer capture). Wired via
  `test.setupFiles` in `vite.config.ts`.
- `src/test/a11y.ts` — the `axeCheck()` runner and the
  `toHaveNoViolations()` matcher.
- `src/test/test-utils.tsx` — `renderWithProviders()`.
