import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ui/toast'
import type { User, Session } from '@supabase/supabase-js'
import type { Community, Member } from '@/core/identity/types'

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

interface TestWrapperProps {
  children: ReactNode
  queryClient?: QueryClient
  initialEntries?: string[]
}

/**
 * Wraps components with QueryClientProvider, MemoryRouter, and ToastProvider.
 * For auth/community, mock the providers module in your test:
 *   vi.mock('@/app/providers', () => ({
 *     useAuth: () => ({ user: createMockUser(), loading: false, ... }),
 *     useCommunityContext: () => ({ communityId: 'c1', community: createMockCommunity(), ... }),
 *   }))
 */
export function TestWrapper({ children, queryClient = defaultQueryClient, initialEntries = ['/'] }: TestWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
          {children}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'test@civitas.test',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as User
}

export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides,
  } as Session
}

export function createMockCommunity(overrides?: Partial<Community>): Community {
  return {
    id: 'community-1',
    name: 'Test Community',
    type: 'general',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Community
}

export function createMockMember(overrides?: Partial<Member>): Member {
  return {
    id: 'member-1',
    user_id: 'user-1',
    community_id: 'community-1',
    role: 'miembro',
    status: 'active',
    email: 'test@civitas.test',
    full_name: 'Test User',
    financial_standing: 'good_standing',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Member
}
