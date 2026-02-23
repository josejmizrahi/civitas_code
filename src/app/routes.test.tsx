/**
 * Tests for routing: AppRouter structure and guard behavior.
 * Mocks auth/community so we can assert without a real router nesting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

const mockUseAuth = vi.fn()
const mockUseCommunityContext = vi.fn()
vi.mock('@/app/providers', () => ({
  useAuth: () => mockUseAuth(),
  useCommunityContext: () => mockUseCommunityContext(),
}))
vi.mock('@/shared/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ message }: { message?: string }) => <div data-testid="loading">{message ?? 'Loading'}</div>,
}))
vi.mock('@/shared/types', () => ({
  hasPermission: (role: string, required: string) => {
    const rank: Record<string, number> = {
      observador: 0,
      miembro: 1,
      tesorero: 2,
      comite_vigilancia: 3,
      admin: 4,
      platform_admin: 5,
    }
    return (rank[role] ?? 0) >= (rank[required] ?? 0)
  },
  type: {},
}))
vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/layouts/AuthLayout', () => ({ AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))

import { AppRouter } from './routes'

describe('AppRouter', () => {
  const setPath = (path: string) => {
    window.history.pushState({}, '', path)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setPath('/')
    mockUseCommunityContext.mockReturnValue({
      communityId: null,
      community: null,
      currentMember: null,
      communityLoading: false,
    })
  })

  it('renders without crashing', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(<AppRouter />)
    expect(document.body).toBeTruthy()
  })

  it('shows loading when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    render(<AppRouter />)
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('unauthenticated at root renders something (landing or redirect)', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    const { container } = render(<AppRouter />)
    expect(container.firstChild).toBeTruthy()
  })

  it('smoke: authenticated user can render critical core routes', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u-1' }, loading: false })
    mockUseCommunityContext.mockReturnValue({
      communityId: 'comm-1',
      community: { id: 'comm-1', type: 'residential' },
      currentMember: { role: 'admin' },
      communityLoading: false,
    })

    const criticalRoutes = ['/dashboard', '/treasury', '/governance', '/members', '/rules', '/settings']
    for (const path of criticalRoutes) {
      setPath(path)
      const { unmount, container } = render(<AppRouter />)
      expect(container.firstChild).toBeTruthy()
      unmount()
    }
  })

  it('smoke: platform_admin can render multi-community route', () => {
    setPath('/admin/communities')
    mockUseAuth.mockReturnValue({ user: { id: 'u-platform' }, loading: false })
    mockUseCommunityContext.mockReturnValue({
      communityId: 'comm-1',
      community: { id: 'comm-1', type: 'residential' },
      currentMember: { role: 'platform_admin' },
      communityLoading: false,
    })

    const { container } = render(<AppRouter />)
    expect(container.firstChild).toBeTruthy()
  })
})
