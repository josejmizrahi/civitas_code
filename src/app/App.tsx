import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, CommunityProvider } from './providers'
import { AppRouter } from './routes'
import { ToastProvider } from '@/shared/components/ui/toast'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
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
