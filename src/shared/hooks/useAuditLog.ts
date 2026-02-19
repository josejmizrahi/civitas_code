import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getAuditLog } from '@/shared/services/audit.service'

export function useAuditLog(options?: { limit?: number; entityType?: string; offset?: number }) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['audit-log', communityId, options],
    queryFn: () => getAuditLog(communityId!, options),
    enabled: !!communityId,
  })
}
