import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, CommunityProvider } from './providers'
import { AppRouter } from './routes'
import { ToastProvider } from '@/shared/components/ui/toast'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

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
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <CommunityProvider>
              <AppRouter />
            </CommunityProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
