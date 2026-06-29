// Accessibility gate — whole-page structure (landmarks, heading hierarchy).
//
// The component specs scan isolated fragments, so axe's *document-level* rules
// never fire there: landmark-one-main (is there exactly one <main>?), region
// (is all content inside a landmark?), page-has-heading-one (exactly one <h1>?),
// and cross-section heading order. This spec renders a real assembled page
// (Navbar + <main> + Footer) and scans the whole document with those rules
// enabled — which, among other things, is what actually guards the Footer
// heading levels against re-introducing an h2 → h4 skip.

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'
import { PrivacyPolicy } from '@/app/components/PrivacyPolicy'

describe('accessibility: whole-page structure', () => {
  it('an assembled page has valid landmarks, one h1, and ordered headings', async () => {
    // Mirror index.html so the document-level lang rule has something to check.
    document.documentElement.lang = 'en'

    renderWithProviders(<PrivacyPolicy />)

    const results = await axeCheck(document.documentElement, {
      rules: {
        // Re-enable the landmark/region rule that fragment specs turn off.
        region: { enabled: true },
        // <title> is owned by index.html / react-helmet, not this component.
        'document-title': { enabled: false },
      },
    })
    expect(results).toHaveNoViolations()
  })
})
