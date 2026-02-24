import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, CommunityProvider } from './providers'
import { TenantProvider } from './providers/TenantProvider'
import { AppRouter } from './routes'
import { ToastProvider } from '@/shared/components/ui/toast'
import { ConfirmProvider } from '@/shared/components/ConfirmDialog'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { ThemeContext, useThemeState } from '@/shared/hooks/useTheme'
import { initializePrimitives } from '@/primitives/setup'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min — data stays fresh
      gcTime: 1000 * 60 * 10,         // 10 min — keep cache after unmount
      refetchOnWindowFocus: false,     // don't refetch on tab focus
      refetchOnMount: false,           // don't refetch on remount if fresh
      refetchOnReconnect: false,       // don't refetch on reconnect
      retry: 1,
    },
  },
})

export default function App() {
  const themeState = useThemeState()

  // Initialize the primitive event system once at app bootstrap
  useEffect(() => {
    const cleanup = initializePrimitives(queryClient)
    return cleanup
  }, [])

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={themeState}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <CommunityProvider>
                  <TenantProvider>
                    <AppRouter />
                  </TenantProvider>
                </CommunityProvider>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  )
}
