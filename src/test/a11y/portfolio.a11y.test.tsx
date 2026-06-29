// Accessibility gate — portfolio section in its LOADED state.
//
// Portfolio opens a live Firestore subscription on mount, so it can't render its
// real grid offline (and is excluded from sections.a11y.test.tsx for that
// reason). Here the data hook is stubbed with sample projects so the loaded grid
// renders — covering each card's image alt text, the "View project" link names,
// and the category filter buttons (aria-pressed).

import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'

vi.mock('@/app/hooks/usePortfolio', () => {
  const projects: import('@/app/lib/portfolio').PortfolioProject[] = [
    {
      id: '1',
      title: 'Acme Storefront',
      description: 'A fast, conversion-focused e-commerce build.',
      category: 'E-commerce',
      industry: 'Retail',
      imageUrl: 'https://example.com/acme.jpg',
      technologies: ['React', 'Node'],
      projectUrl: 'https://acme.example.com',
      githubUrl: '',
      order: 1,
    },
    {
      id: '2',
      title: 'Globex Analytics Dashboard',
      description: 'A realtime analytics SaaS dashboard.',
      category: 'SaaS',
      industry: 'Analytics',
      imageUrl: 'https://example.com/globex.jpg',
      technologies: ['React', 'Recharts'],
      projectUrl: '',
      githubUrl: 'https://github.com/example/globex',
      order: 2,
    },
  ]
  return {
    usePublishedPortfolio: () => ({ projects, loading: false, error: false }),
  }
})

// Imported after the mock is declared (vi.mock is hoisted above imports anyway).
import { Portfolio } from '@/app/components/Portfolio'

describe('accessibility: portfolio (loaded grid)', () => {
  it('renders the project grid with no axe violations', async () => {
    const { container } = renderWithProviders(<Portfolio />)
    expect(await axeCheck(container)).toHaveNoViolations()
  })
})
