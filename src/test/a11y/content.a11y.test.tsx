// Accessibility gate — static content + interactive sections.
//
// Each case renders a component in isolation (inside router/theme/helmet
// providers) and asserts axe-core finds zero violations. A regression that
// drops a form label, an icon-only button's name, a heading level, or an
// image's alt text makes this suite — and therefore CI — fail.
//
// Scope note: colour-contrast and landmark-region rules are disabled in jsdom
// (no layout engine); see src/test/a11y.ts and docs/accessibility-testing.md.

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'

import { Footer } from '@/app/components/Footer'
import NotFound from '@/app/components/NotFound'
import { PrivacyPolicy } from '@/app/components/PrivacyPolicy'
import { TermsOfService } from '@/app/components/TermsOfService'
import { CookiePolicy } from '@/app/components/CookiePolicy'
import { About } from '@/app/components/About'
import { Careers } from '@/app/components/Careers'
import { Blog } from '@/app/components/Blog'
import { FAQ } from '@/app/components/FAQ'
import { Pricing } from '@/app/components/Pricing'
import { QuoteForm } from '@/app/components/QuoteForm'

const cases = [
  { name: 'Footer', ui: <Footer /> },
  { name: 'NotFound', ui: <NotFound /> },
  { name: 'PrivacyPolicy', ui: <PrivacyPolicy /> },
  { name: 'TermsOfService', ui: <TermsOfService /> },
  { name: 'CookiePolicy', ui: <CookiePolicy /> },
  { name: 'About', ui: <About /> },
  { name: 'Careers', ui: <Careers /> },
  { name: 'Blog', ui: <Blog /> },
  { name: 'FAQ', ui: <FAQ /> },
  { name: 'Pricing', ui: <Pricing /> },
  { name: 'QuoteForm', ui: <QuoteForm /> },
] as const

describe('accessibility: content & interactive sections', () => {
  it.each(cases)('$name has no axe violations', async ({ ui }) => {
    const { container } = renderWithProviders(ui)
    expect(await axeCheck(container)).toHaveNoViolations()
  })
})
