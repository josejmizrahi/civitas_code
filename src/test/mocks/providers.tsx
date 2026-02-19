import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

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
 * Wraps components with QueryClientProvider and MemoryRouter.
 * Use this for component tests that use React Query or routing.
 * For auth/community, mock the providers module in your test:
 *   vi.mock('@/app/providers', () => ({
 *     useAuth: () => ({ user: createMockUser(), loading: false, ... }),
 *     useCommunityContext: () => ({ communityId: 'c1', community: createMockCommunity(), ... }),
 *   }))
 */
export function TestWrapper({ children, queryClient = defaultQueryClient, initialEntries = ['/'] }: TestWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}
