// Accessibility gate — landing-page marketing sections.
//
// These are the animation-heavy sections assembled on the home page. They are
// rendered as isolated fragments (no surrounding <main> landmark), so the
// landmark-`region` rule is disabled by default in src/test/a11y.ts; the checks
// that matter here are image alt text, accessible names for icon buttons/links,
// heading order within the section, and valid ARIA.

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'

import { Hero } from '@/app/components/Hero'
import { TrustedBy } from '@/app/components/TrustedBy'
import { Services } from '@/app/components/Services'
import { Process } from '@/app/components/Process'
import { WhyChoose } from '@/app/components/WhyChoose'
import { Testimonials } from '@/app/components/Testimonials'
import { FinalCTA } from '@/app/components/FinalCTA'

// Portfolio is intentionally NOT here: it opens a live Firestore subscription on
// mount, which would hit the network on CI. It is covered with a mocked data
// hook in portfolio.a11y.test.tsx instead.
const cases = [
  { name: 'Hero', ui: <Hero /> },
  { name: 'TrustedBy', ui: <TrustedBy /> },
  { name: 'Services', ui: <Services /> },
  { name: 'Process', ui: <Process /> },
  { name: 'WhyChoose', ui: <WhyChoose /> },
  { name: 'Testimonials', ui: <Testimonials /> },
  { name: 'FinalCTA', ui: <FinalCTA /> },
] as const

describe('accessibility: landing sections', () => {
  it.each(cases)('$name has no axe violations', async ({ ui }) => {
    const { container } = renderWithProviders(ui)
    expect(await axeCheck(container)).toHaveNoViolations()
  })
})
