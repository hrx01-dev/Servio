// Accessibility gate — portfolio section, both data states.
//
// Portfolio opens a live Firestore subscription on mount, so it can't render its
// real markup offline (and is excluded from sections.a11y.test.tsx for that
// reason). Its data hook is stubbed here so both branches render: the loaded
// grid (image alt text, "View project" link names, category filter buttons) and
// the loading skeleton (the role="status" region).

import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/test-utils'
import { axeCheck } from '@/test/a11y'
import type { PortfolioProject } from '@/app/lib/portfolio'

vi.mock('@/app/hooks/usePortfolio', () => ({ usePublishedPortfolio: vi.fn() }))

// Imported after the mock is declared (vi.mock is hoisted above imports anyway).
import { usePublishedPortfolio } from '@/app/hooks/usePortfolio'
import { Portfolio } from '@/app/components/Portfolio'

const mockHook = vi.mocked(usePublishedPortfolio)

const projects: PortfolioProject[] = [
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

describe('accessibility: portfolio', () => {
  it('loaded grid has no axe violations', async () => {
    mockHook.mockReturnValue({ projects, loading: false, error: false })
    const { container } = renderWithProviders(<Portfolio />)
    expect(await axeCheck(container)).toHaveNoViolations()
  })

  it('loading skeleton has no axe violations', async () => {
    mockHook.mockReturnValue({ projects: [], loading: true, error: false })
    const { container } = renderWithProviders(<Portfolio />)
    // Confirm the status region rendered so the scan isn't vacuous.
    expect(screen.getByRole('status', { name: 'Loading portfolio' })).toBeInTheDocument()
    expect(await axeCheck(container)).toHaveNoViolations()
  })
})
