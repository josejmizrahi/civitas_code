import { useState } from 'react'
import { useIfpeEvents, useReconciliationStats, useManualReconcile, useIgnoreEvent } from '../hooks/useIfpe'
import { usePaymentObligations } from '../hooks/usePaymentStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useToast } from '@/shared/components/ui/toast'
import { formatCurrency } from '@/shared/lib/utils'
import {
  ArrowDownUp,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  AlertTriangle,
} from 'lucide-react'
import type { IfpeWebhookEvent } from '../services/ifpe.service'

const STATUS_COLORS: Record<string, string> = {
  matched: 'bg-green-100 text-green-800',
  manual: 'bg-blue-100 text-blue-800',
  unmatched: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-800',
  ignored: 'bg-gray-50 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  matched: 'Conciliado',
  manual: 'Manual',
  unmatched: 'Sin conciliar',
  pending: 'Pendiente',
  ignored: 'Ignorado',
}

export function IfpeReconciliationPanel() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: events, isLoading } = useIfpeEvents(filter)
  const { data: stats } = useReconciliationStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowDownUp className="h-4 w-4" />
          Reconciliación SPEI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Eventos totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
              <div className="text-xs text-muted-foreground">Conciliados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.unmatched}</div>
              <div className="text-xs text-muted-foreground">Sin conciliar</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(stats.matchedAmount)}</div>
              <div className="text-xs text-muted-foreground">Monto conciliado</div>
            </div>
          </div>
        )}

        <div className="flex gap-1 flex-wrap">
          {[undefined, 'unmatched', 'pending', 'matched', 'ignored'].map((s) => (
            <Button
              key={s ?? 'all'}
              size="sm"
              variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s)}
              className="text-xs"
            >
              {s ? STATUS_LABELS[s] : 'Todos'}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSpinner message="Cargando eventos..." className="py-4" />
        ) : (events ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay eventos SPEI registrados.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(events ?? []).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EventRow({ event }: { event: IfpeWebhookEvent }) {
  const toast = useToast()
  const reconcileMut = useManualReconcile()
  const ignoreMut = useIgnoreEvent()
  const { data: obligations } = usePaymentObligations()
  const [showReconcile, setShowReconcile] = useState(false)

  const pendingObligations = (obligations ?? []).filter(
    (o) => o.status === 'pending' || o.status === 'overdue'
  )

  const handleReconcile = (obligationId: string) => {
    reconcileMut.mutate(
      { eventId: event.id, obligationId },
      {
        onSuccess: () => {
          toast.success('Evento conciliado correctamente')
          setShowReconcile(false)
        },
        onError: (err: any) => toast.error(err?.message || 'Error al conciliar'),
      }
    )
  }

  const handleIgnore = () => {
    ignoreMut.mutate(event.id, {
      onSuccess: () => toast.success('Evento ignorado'),
      onError: (err: any) => toast.error(err?.message || 'Error'),
    })
  }

  const canReconcile = event.reconciliation_status === 'unmatched' || event.reconciliation_status === 'pending'

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{formatCurrency(Number(event.monto))}</span>
            <Badge className={`text-[10px] ${STATUS_COLORS[event.reconciliation_status]}`}>
              {STATUS_LABELS[event.reconciliation_status]}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {event.nombre_ordenante && <span>{event.nombre_ordenante} · </span>}
            {event.concepto && <span>{event.concepto} · </span>}
            {event.fecha_operacion}
          </div>
          {event.clave_rastreo && (
            <div className="text-[10px] font-mono text-muted-foreground">
              Rastreo: {event.clave_rastreo}
            </div>
          )}
        </div>
        {canReconcile && (
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setShowReconcile(!showReconcile)} className="text-xs h-7">
              <Link2 className="h-3 w-3 mr-1" />
              Conciliar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleIgnore} disabled={ignoreMut.isPending} className="text-xs h-7 text-muted-foreground">
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        )}
        {event.reconciliation_status === 'matched' && (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        )}
      </div>

      {showReconcile && (
        <div className="border-t pt-2 space-y-1">
          <p className="text-xs font-medium">Selecciona la obligación a vincular:</p>
          {pendingObligations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay obligaciones pendientes.</p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {pendingObligations.map((ob) => (
                <button
                  key={ob.id}
                  onClick={() => handleReconcile(ob.id)}
                  disabled={reconcileMut.isPending}
                  className="w-full flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  <span className="truncate">
                    {ob.concept} — {ob.member_name || ob.member_id.substring(0, 8)}
                  </span>
                  <span className="font-medium shrink-0 ml-2">
                    {formatCurrency(ob.amount)}
                    {Math.abs(ob.amount - Number(event.monto)) < 0.01 && (
                      <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-500" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
