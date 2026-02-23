import { useCommunityContext } from '@/app/providers'
import { communityPath } from '@/shared/lib/communityRoutes'

/**
 * Returns a function to build community-scoped paths using the current community slug.
 * Returns (path?) => string. If no community or slug, returns path without prefix for safety (callers should check).
 */
export function useCommunityPath(): (path?: string) => string {
  const { community } = useCommunityContext()
  const slug = community?.slug ?? ''
  return (path?: string) => (slug ? communityPath(slug, path) : path ?? '/dashboard')
}
