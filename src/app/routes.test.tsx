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
  hasPermission: (_role: string, required: string) => required === 'observador' || _role === 'admin',
  type: {},
}))
vi.mock('@/layouts/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/layouts/AuthLayout', () => ({ AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))

import { AppRouter } from './routes'

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
