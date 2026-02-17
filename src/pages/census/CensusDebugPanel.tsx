import { useEffect, useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  useCensusSnapshots,
  useLatestCensus,
  usePlatformCensus,
} from '@/census/hooks/useCensus'

/**
 * CensusDebugPanel
 * 
 * A debugging component to help diagnose issues with the Census page.
 * 
 * To use:
 * 1. Import this component in CensusPage.tsx
 * 2. Add <CensusDebugPanel /> at the top of the page
 * 3. Check the debug information displayed
 * 4. Remove after debugging is complete
 */
export function CensusDebugPanel() {
  const { communityId, community, currentMember, communityLoading, communityError } = useCommunityContext()
  const censusSnapshotsQuery = useCensusSnapshots()
  const latestCensusQuery = useLatestCensus()
  const platformCensusQuery = usePlatformCensus()
  const [consoleErrors, setConsoleErrors] = useState<string[]>([])

  // Capture console errors
  useEffect(() => {
    const originalError = console.error
    const errors: string[] = []

    console.error = (...args: unknown[]) => {
      const errorMsg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      errors.push(errorMsg)
      setConsoleErrors([...errors])
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  const getQueryStatus = (query: { isLoading: boolean; isError: boolean; error: unknown; data: unknown }) => {
    if (query.isLoading) return { status: 'loading', color: 'yellow' }
    if (query.isError) return { status: 'error', color: 'red' }
    if (query.data) return { status: 'success', color: 'green' }
    return { status: 'idle', color: 'gray' }
  }

  const snapshotsStatus = getQueryStatus(censusSnapshotsQuery)
  const latestStatus = getQueryStatus(latestCensusQuery)
  const platformStatus = getQueryStatus(platformCensusQuery)

  return (
    <Card className="mb-6 border-2 border-yellow-500 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔍 Census Debug Panel
          <Badge variant="outline" className="text-xs">
            Development Only - Remove Before Production
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Community Context */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Community Context</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">Community ID:</span>{' '}
              {communityId ? (
                <Badge variant="success">{communityId}</Badge>
              ) : (
                <Badge variant="destructive">NULL</Badge>
              )}
            </div>
            <div>
              <span className="font-medium">Community Name:</span>{' '}
              {community?.name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Current Member:</span>{' '}
              {currentMember?.full_name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Member Role:</span>{' '}
              {currentMember?.role || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Loading:</span>{' '}
              {communityLoading ? (
                <Badge variant="outline">Yes</Badge>
              ) : (
                <Badge variant="success">No</Badge>
              )}
            </div>
            <div>
              <span className="font-medium">Error:</span>{' '}
              {communityError ? (
                <Badge variant="destructive">{communityError}</Badge>
              ) : (
                <Badge variant="success">None</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Query States */}
        <div>
          <h3 className="font-semibold text-sm mb-2">React Query States</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge 
                variant={snapshotsStatus.color === 'green' ? 'success' : snapshotsStatus.color === 'red' ? 'destructive' : 'outline'}
              >
                {snapshotsStatus.status}
              </Badge>
              <span className="font-medium">Census Snapshots Query</span>
              {censusSnapshotsQuery.isError && (
                <span className="text-red-600 text-xs">
                  Error: {String(censusSnapshotsQuery.error)}
                </span>
              )}
              {censusSnapshotsQuery.data && (
                <span className="text-green-600">
                  ({Array.isArray(censusSnapshotsQuery.data) ? censusSnapshotsQuery.data.length : 0} snapshots)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant={latestStatus.color === 'green' ? 'success' : latestStatus.color === 'red' ? 'destructive' : 'outline'}
              >
                {latestStatus.status}
              </Badge>
              <span className="font-medium">Latest Census Query</span>
              {latestCensusQuery.isError && (
                <span className="text-red-600 text-xs">
                  Error: {String(latestCensusQuery.error)}
                </span>
              )}
              {latestCensusQuery.data && (
                <span className="text-green-600">
                  (Total: {latestCensusQuery.data.total_members}, Active: {latestCensusQuery.data.active_members})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant={platformStatus.color === 'green' ? 'success' : platformStatus.color === 'red' ? 'destructive' : 'outline'}
              >
                {platformStatus.status}
              </Badge>
              <span className="font-medium">Platform Census Query</span>
              {platformCensusQuery.isError && (
                <span className="text-red-600 text-xs">
                  Error: {String(platformCensusQuery.error)}
                </span>
              )}
              {platformCensusQuery.data && (
                <span className="text-green-600">
                  ({platformCensusQuery.data.total_communities} communities)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Local Storage */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Local Storage</h3>
          <div className="text-xs">
            <span className="font-medium">civitas_community_id:</span>{' '}
            {localStorage.getItem('civitas_community_id') || 'Not Set'}
          </div>
        </div>

        {/* Console Errors */}
        {consoleErrors.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-red-600">
              Console Errors ({consoleErrors.length})
            </h3>
            <div className="bg-red-50 border border-red-200 rounded p-2 max-h-32 overflow-y-auto">
              {consoleErrors.map((error, i) => (
                <div key={i} className="text-xs text-red-700 font-mono mb-1">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="border-t pt-3">
          <h3 className="font-semibold text-sm mb-2">Diagnostic Recommendations</h3>
          <div className="text-xs space-y-1">
            {!communityId && (
              <div className="text-red-600">
                ⚠ Community ID is NULL. User needs to select a community or be assigned to one.
              </div>
            )}
            {censusSnapshotsQuery.isError && (
              <div className="text-red-600">
                ⚠ Census snapshots query failed. Check database table 'census_snapshots' exists and user has permissions.
              </div>
            )}
            {platformCensusQuery.isError && (
              <div className="text-red-600">
                ⚠ Platform census query failed. Check database function 'get_platform_census' exists.
              </div>
            )}
            {communityError && (
              <div className="text-red-600">
                ⚠ Community context error: {communityError}
              </div>
            )}
            {!censusSnapshotsQuery.isError && !platformCensusQuery.isError && communityId && (
              <div className="text-green-600">
                ✓ All queries are working correctly!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
