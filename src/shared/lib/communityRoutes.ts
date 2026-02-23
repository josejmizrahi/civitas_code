/**
 * Helpers for community-scoped routes: /c/:slug/...
 * Use these so all links and redirects include the slug (multi-tenant URLs).
 */

const BASE = '/c'

/**
 * Build path under a community. If path is omitted, returns dashboard.
 * @example communityPath('torre-norte') → '/c/torre-norte/dashboard'
 * @example communityPath('torre-norte', 'governance/abc-123') → '/c/torre-norte/governance/abc-123'
 */
export function communityPath(slug: string, path?: string): string {
  const segment = (path ?? 'dashboard').replace(/^\//, '')
  return `${BASE}/${encodeURIComponent(slug)}/${segment}`
}

/** Check if a pathname is under /c/:slug */
export function isCommunityPath(pathname: string): boolean {
  return pathname.startsWith(BASE + '/') && pathname.length > BASE.length + 2
}

/** Extract slug from pathname like /c/torre-norte/dashboard */
export function getSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith(BASE + '/')) return null
  const rest = pathname.slice(BASE.length + 1)
  const nextSlash = rest.indexOf('/')
  return nextSlash >= 0 ? rest.slice(0, nextSlash) : rest
}
