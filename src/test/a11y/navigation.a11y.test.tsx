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

  it('returns focus to the menu trigger after choosing a mobile navigation item', () => {
    renderWithProviders(<Navbar />)
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)

    const menu = document.getElementById('mobile-menu')
    expect(menu).not.toBeNull()
    const firstItem = menu!.querySelector<HTMLButtonElement>('button')
    expect(firstItem).not.toBeNull()

    firstItem!.focus()
    fireEvent.click(firstItem!)
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('wraps keyboard focus at both ends of the open mobile menu', () => {
    renderWithProviders(<Navbar />)
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)

    const menu = document.getElementById('mobile-menu')
    expect(menu).not.toBeNull()
    const focusable = Array.from(
      menu!.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    )
    expect(focusable.length).toBeGreaterThan(1)

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('closes the mobile menu and restores focus on Escape', () => {
    renderWithProviders(<Navbar />)
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

})