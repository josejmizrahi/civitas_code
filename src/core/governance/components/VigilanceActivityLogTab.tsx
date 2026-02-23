import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getAuditLog } from '@/shared/services/audit.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatDateTime } from '@/shared/lib/utils'
import { Activity } from 'lucide-react'

const VIGILANCE_ACTIONS = [
  'register_transaction',
  'register_income',
  'approve_discretionary',
  'request_audit',
  'flag_transaction',
  'create_proposal',
  'execute_proposal',
  'appeal_proposal',
]

export function VigilanceActivityLogTab() {
  const { communityId } = useCommunityContext()
  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log-vigilance', communityId],
    queryFn: () => getAuditLog(communityId!, { limit: 80, actions: VIGILANCE_ACTIONS }),
    enabled: !!communityId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity Log (admin / tesorero)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : !entries?.length ? (
          <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
                <div className="flex-1 min-w-0">
                  <p>
                    <span className="font-medium">{entry.action}</span>
                    {' · '}
                    <span className="text-muted-foreground">{entry.entity_type}</span>
                    {entry.entity_id && (
                      <span className="text-muted-foreground"> ({entry.entity_id.slice(0, 8)}…)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
