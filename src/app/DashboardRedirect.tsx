import { Navigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { communityPath } from '@/shared/lib/communityRoutes'

/**
 * Redirects /dashboard (no slug) to /c/:slug/dashboard or /communities or /onboarding.
 */
export function DashboardRedirect() {
  const { userCommunities } = useCommunityContext()
  if (userCommunities.length === 0) return <Navigate to="/onboarding" replace />
  if (userCommunities.length === 1) {
    return <Navigate to={communityPath(userCommunities[0].slug, 'dashboard')} replace />
  }
  return <Navigate to="/communities" replace />
}
