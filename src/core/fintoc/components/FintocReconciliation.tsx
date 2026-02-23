import { useState } from 'react'
import { useFintocEvents, useFintocReconciliationStats, useManualReconcile, useIgnoreEvent } from '../hooks/useFintoc'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useCommunityContext } from '@/app/providers'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useToast } from '@/shared/components/ui/toast'
import { ArrowDownLeft, Link2, Filter, Ban } from 'lucide-react'
import type { FintocEvent } from '../types'

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  matched: { label: 'Conciliado', variant: 'default' },
  manual: { label: 'Manual', variant: 'default' },
  unmatched: { label: 'Sin conciliar', variant: 'destructive' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  ignored: { label: 'Ignorado', variant: 'secondary' },
}

export function FintocReconciliation() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [matchingEvent, setMatchingEvent] = useState<FintocEvent | null>(null)
  const [selectedObligation, setSelectedObligation] = useState('')

  const { data: events, isLoading } = useFintocEvents(statusFilter || undefined)
  const { data: stats } = useFintocReconciliationStats()
  useCommunityContext()
  const { data: obligations } = usePaymentObligations(undefined)
  const reconcile = useManualReconcile()
  const ignore = useIgnoreEvent()
  const toast = useToast()

  const pendingObligations = (obligations ?? []).filter(
    (o) => o.status === 'pending' || o.status === 'overdue',
  )

  const handleReconcile = async () => {
    if (!matchingEvent || !selectedObligation) return
    try {
      await reconcile.mutateAsync({ eventId: matchingEvent.id, obligationId: selectedObligation })
      toast.success('Evento conciliado exitosamente')
      setMatchingEvent(null)
      setSelectedObligation('')
    } catch {
      toast.error('Error al conciliar')
    }
  }

  const handleIgnore = async (eventId: string) => {
    try {
      await ignore.mutateAsync(eventId)
      toast.success('Evento ignorado')
    } catch {
      toast.error('Error al ignorar')
    }
  }

  const formatAmount = (cents: number | null) => {
    if (!cents) return '$0.00'
    return `$${(cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="rounded-xl">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-green-600">Conciliados</p>
              <p className="text-lg font-bold text-green-600">{stats.matched}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-red-600">Sin conciliar</p>
              <p className="text-lg font-bold text-red-600">{stats.unmatched}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-lg font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">$ Conciliado</p>
              <p className="text-lg font-bold">${stats.total_amount_matched.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="matched">Conciliados</option>
          <option value="unmatched">Sin conciliar</option>
          <option value="ignored">Ignorados</option>
        </Select>
      </div>

      {/* Events list */}
      {isLoading ? (
        <LoadingSpinner className="py-8" />
      ) : !events?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ArrowDownLeft className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin eventos de pago registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((evt) => {
            const badge = STATUS_BADGES[evt.reconciliation_status] || STATUS_BADGES.pending
            return (
              <Card key={evt.id} className="rounded-xl">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ArrowDownLeft className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm font-semibold">{formatAmount(evt.amount)}</span>
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {evt.counterparty_name || 'Transferencia'} · {evt.counterparty_clabe || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evt.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {evt.tracking_key && ` · ${evt.tracking_key}`}
                      </p>
                    </div>
                    {(evt.reconciliation_status === 'unmatched' || evt.reconciliation_status === 'pending') && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setMatchingEvent(evt); setSelectedObligation('') }}>
                          <Link2 className="h-3 w-3" /> Conciliar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleIgnore(evt.id)}>
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Manual reconciliation dialog */}
      <Dialog open={!!matchingEvent} onOpenChange={() => setMatchingEvent(null)}>
        <DialogContent onClose={() => setMatchingEvent(null)}>
          <DialogHeader>
            <DialogTitle>Conciliar pago manualmente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {matchingEvent && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-sm font-medium">Pago recibido: {formatAmount(matchingEvent.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  De: {matchingEvent.counterparty_name || 'Desconocido'} · {matchingEvent.counterparty_clabe}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Selecciona la obligación de pago:</p>
              {pendingObligations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay obligaciones pendientes</p>
              ) : (
                <Select value={selectedObligation} onChange={(e) => setSelectedObligation(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {pendingObligations.map((ob) => (
                    <option key={ob.id} value={ob.id}>
                      {ob.concept} — ${Number(ob.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      {' '}({ob.member_name || ob.member_id.substring(0, 8)})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchingEvent(null)}>Cancelar</Button>
            <Button onClick={handleReconcile} disabled={!selectedObligation || reconcile.isPending}>
              {reconcile.isPending ? 'Conciliando...' : 'Conciliar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
