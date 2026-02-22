/**
 * Tests for AuthProvider and CommunityProvider (and useAuth / useCommunityContext).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth, CommunityProvider, useCommunityContext } from './providers'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signInWithPassword: (opts: unknown) => mockSignInWithPassword(opts),
      signUp: (opts: unknown) => mockSignUp(opts),
      signOut: () => mockSignOut(),
      resetPasswordForEmail: (email: string, opts: unknown) => mockResetPasswordForEmail(email, opts),
      updateUser: (opts: unknown) => mockUpdateUser(opts),
    },
  },
}))

vi.mock('@/shared/components/ui/toast', () => ({
  useToast: () => ({ info: vi.fn(), error: vi.fn(), success: vi.fn(), toast: vi.fn() }),
}))

vi.mock('@/core/identity/services/identity.service', () => ({
  getCommunity: vi.fn().mockResolvedValue({ id: 'c1', name: 'Test' }),
  getCurrentMember: vi.fn().mockResolvedValue({ id: 'm1', role: 'admin' }),
  getUserCommunities: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Test' }]),
}))

function Consumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user?.email ?? 'none'}</span>
    </div>
  )
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => render(<Consumer />)).toThrow('useAuth must be used within AuthProvider')
  })
})

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  it('renders children and provides auth context', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )
    await screen.findByTestId('loading')
    expect(screen.getByTestId('user')).toBeInTheDocument()
  })

  it('eventually sets loading to false after getSession', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )
    await screen.findByTestId('loading')
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    }, { timeout: 2000 })
  })
})

function CommunityConsumer() {
  const ctx = useCommunityContext()
  return (
    <div>
      <span data-testid="community-id">{ctx.communityId ?? 'none'}</span>
      <span data-testid="community-loading">{String(ctx.communityLoading)}</span>
    </div>
  )
}

describe('useCommunityContext', () => {
  it('throws when used outside CommunityProvider', () => {
    expect(() => render(<CommunityConsumer />)).toThrow('useCommunityContext must be used within CommunityProvider')
  })
})

describe('CommunityProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
  })

  it('renders children and provides community context', async () => {
    render(
      <AuthProvider>
        <CommunityProvider>
          <CommunityConsumer />
        </CommunityProvider>
      </AuthProvider>,
    )
    expect(screen.getByTestId('community-id')).toBeInTheDocument()
    expect(screen.getByTestId('community-loading')).toBeInTheDocument()
  })
})
