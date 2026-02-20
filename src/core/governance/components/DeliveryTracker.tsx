import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { formatDate } from '@/shared/lib/utils'
import { Send, Check, AlertTriangle, Clock } from 'lucide-react'

interface DeliveryRecord {
  id: string
  member_id: string | null
  member_name: string
  delivery_status: string
  delivery_channel: string
  delivered_at: string | null
  created_at: string
}

interface Props {
  /** Filter by notification type, e.g. 'convocatoria' */
  notificationType?: string
  /** Filter by related entity ID (proposal_id, assembly_id, etc.) */
  relatedId?: string
}

const statusConfig: Record<string, { label: string; icon: typeof Check; color: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' }> = {
  delivered: { label: 'Entregada', icon: Check, color: 'text-green-600', variant: 'success' },
  sent: { label: 'Enviada', icon: Send, color: 'text-blue-600', variant: 'default' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-muted-foreground', variant: 'secondary' },
  failed: { label: 'Fallida', icon: AlertTriangle, color: 'text-red-600', variant: 'destructive' },
}

export function DeliveryTracker({ notificationType, relatedId }: Props) {
  const { communityId } = useCommunityContext()

  const { data: records, isLoading } = useQuery({
    queryKey: ['delivery-tracker', communityId, notificationType, relatedId],
    queryFn: async () => {
      let query = supabase.from('notifications')
        .select('id, delivery_status, delivery_channel, delivered_at, created_at, member_id')
        .eq('community_id', communityId!)
        .order('created_at', { ascending: false })
        .limit(100)

      if (notificationType) query = query.eq('type', notificationType)
      if (relatedId) query = query.eq('related_id', relatedId)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as DeliveryRecord[]
    },
    enabled: !!communityId,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-4">Cargando estado de entrega...</p>
  }

  const items = records ?? []
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay notificaciones para rastrear.
        </CardContent>
      </Card>
    )
  }

  const delivered = items.filter((r) => r.delivery_status === 'delivered').length
  const sent = items.filter((r) => r.delivery_status === 'sent').length
  const failed = items.filter((r) => r.delivery_status === 'failed').length
  const pending = items.filter((r) => r.delivery_status === 'pending').length
  const total = items.length
  const deliveryPct = total > 0 ? Math.round(((delivered + sent) / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          Estado de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Entregadas</p>
            <p className="text-lg font-bold text-green-600">{delivered}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Enviadas</p>
            <p className="text-lg font-bold text-blue-600">{sent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-lg font-bold text-muted-foreground">{pending}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fallidas</p>
            <p className="text-lg font-bold text-red-600">{failed}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tasa de entrega</span>
            <span>{deliveryPct}%</span>
          </div>
          <Progress value={deliveryPct} className="h-2" />
        </div>

        {/* Individual records */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {items.slice(0, 30).map((record) => {
            const cfg = statusConfig[record.delivery_status] || statusConfig.pending
            const Icon = cfg.icon
            return (
              <div key={record.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  <span className="truncate max-w-[200px]">{(record as any).member_name || record.member_id?.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(record.delivered_at || record.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
