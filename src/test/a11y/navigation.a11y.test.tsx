// Accessibility gate — primary navigation.
//
// The Navbar carries the heaviest interactive a11y surface on the site: the
// brand link, the desktop nav, the theme toggle, and the mobile menu trigger. A
// missing accessible name on any icon-only control (hamburger, theme switch) is
// the most common regression here. Both the default state AND the opened mobile
// menu (its links + close button) are scanned.

import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, fireEvent } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'
import { Navbar } from '@/app/components/Navbar'

describe('accessibility: navigation', () => {
  it('Navbar has no axe violations', async () => {
    const { container } = renderWithProviders(<Navbar />)
    expect(await axeCheck(container)).toHaveNoViolations()
  })

  it('Navbar with the mobile menu open has no axe violations', async () => {
    const { container } = renderWithProviders(<Navbar />)
    const toggle = screen.getByLabelText('Open menu')
    fireEvent.click(toggle)
    // Confirm the menu actually opened so the scan isn't vacuous.
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await axeCheck(container)).toHaveNoViolations()
  })
})
