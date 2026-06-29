// Shared render helper for component tests. Wraps the UI in the providers the
// app's components expect at runtime so a component can be mounted in isolation
// without each test re-assembling the provider tree:
//
//  - a *data* router (createMemoryRouter) — Link / useNavigate AND the data-only
//    hooks the app uses, e.g. useBlocker in QuoteForm's unsaved-changes guard,
//    which throws under the non-data <MemoryRouter>.
//  - react-helmet-async — components that set <title>/meta.
//  - ThemeProvider — the dark-mode context.
//  - AdminProvider — the shared <Navbar> reads admin state via useAdmin().
//
// Firebase auth/firestore init is harmless in jsdom; analytics init is guarded
// by isSupported() in src/Firebase/firebase.ts, so no Firebase mock is needed.

import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { RouterProvider, createMemoryRouter, useRouteError } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '@/app/hooks/useTheme'
import { AdminProvider } from '@/admin/context/AdminContext'

export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {},
) {
  // A data router catches a render-time throw in its default error boundary and
  // renders a *clean* error page — which axe would scan as violation-free,
  // letting a crashing component pass the gate silently. Route the error through
  // a probe and re-throw it so a broken component fails the test loudly.
  let renderError: unknown
  function ErrorProbe() {
    renderError = useRouteError()
    return null
  }

  // A splat route renders `ui` for the initial "/" entry while giving the tree
  // a real data router so data-router hooks resolve. The future flags silence
  // react-router v6's v7-migration console warnings.
  const router = createMemoryRouter(
    [{ path: '*', element: ui, errorElement: <ErrorProbe /> }],
    {
      initialEntries: ['/'],
      future: { v7_relativeSplatPath: true },
    },
  )
  const result = render(
    <HelmetProvider>
      <ThemeProvider>
        <AdminProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AdminProvider>
      </ThemeProvider>
    </HelmetProvider>,
    options,
  )
  if (renderError !== undefined) throw renderError
  return result
}

// Re-export the Testing Library API so tests import everything from one place.
export * from '@testing-library/react'
