import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import {
  getPaymentPlan,
  getInstallments,
  markInstallmentPaid,
  cancelPaymentPlan,
} from '../services/payment-plan.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Ban,
} from 'lucide-react'

interface Props {
  planId: string
  onClose?: () => void
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' }> = {
  proposed: { label: 'Propuesto', variant: 'secondary' },
  active: { label: 'Activo', variant: 'default' },
  completed: { label: 'Completado', variant: 'success' },
  defaulted: { label: 'Incumplido', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
}

const installmentStatusIcon: Record<string, typeof CheckCircle2> = {
  paid: CheckCircle2,
  pending: Clock,
  overdue: AlertTriangle,
  partial: DollarSign,
}

export function PaymentPlanDetail({ planId, onClose }: Props) {
  const { communityId: _communityId } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const queryClient = useQueryClient()

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['payment-plan', planId],
    queryFn: () => getPaymentPlan(planId),
  })

  const { data: installments, isLoading: instLoading } = useQuery({
    queryKey: ['payment-plan-installments', planId],
    queryFn: () => getInstallments(planId),
  })

  const markPaidMut = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => markInstallmentPaid(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan-installments', planId] })
      queryClient.invalidateQueries({ queryKey: ['payment-plan', planId] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelPaymentPlan(planId, 'Cancelado por administrador'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', planId] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })

  const progress = useMemo(() => {
    if (!installments || installments.length === 0) return { paid: 0, total: 0, pct: 0, paidAmount: 0 }
    const paid = installments.filter((i) => i.status === 'paid').length
    const paidAmount = installments
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.paid_amount || i.amount), 0)
    return { paid, total: installments.length, pct: Math.round((paid / installments.length) * 100), paidAmount }
  }, [installments])

  if (planLoading || instLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Cargando plan de pago...</p>
  }

  if (!plan) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Plan no encontrado.</p>
  }

  const cfg = statusConfig[plan.status] || statusConfig.proposed

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Plan de Pago
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Deuda Total</p>
              <p className="text-lg font-bold">{formatCurrency(plan.total_debt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parcialidades</p>
              <p className="text-lg font-bold">{plan.number_of_installments}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monto por Parcialidad</p>
              <p className="text-lg font-bold">{formatCurrency(plan.installment_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frecuencia</p>
              <p className="text-lg font-bold capitalize">
                {{ weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }[plan.frequency] || plan.frequency}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">
                {progress.paid}/{progress.total} parcialidades — {formatCurrency(progress.paidAmount)}
              </span>
            </div>
            <Progress value={progress.pct} className="h-3" />
          </div>

          {/* Admin actions */}
          {isAdmin && plan.status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMut.mutate()}
                disabled={cancelMut.isPending}
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                {cancelMut.isPending ? 'Cancelando...' : 'Cancelar Plan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installment Calendar */}
      {installments && installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendario de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {installments.map((inst) => {
                const Icon = installmentStatusIcon[inst.status] || Clock
                const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date()
                const displayStatus = isOverdue ? 'overdue' : inst.status
                const OverdueIcon = isOverdue ? AlertTriangle : Icon

                return (
                  <div
                    key={inst.id}
                    className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border px-3 py-2 ${
                      displayStatus === 'paid'
                        ? 'bg-green-50/50 border-green-200'
                        : displayStatus === 'overdue'
                          ? 'bg-red-50/50 border-red-200'
                          : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <OverdueIcon
                        className={`h-4 w-4 shrink-0 ${
                          displayStatus === 'paid'
                            ? 'text-green-600'
                            : displayStatus === 'overdue'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        }`}
                      />
                      <div>
                        <span className="text-sm font-medium">
                          Parcialidad #{inst.installment_number}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          Vence: {formatDate(inst.due_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                      <span className="text-sm font-medium">{formatCurrency(inst.amount)}</span>

                      {inst.status === 'paid' && (
                        <Badge variant="success">Pagada</Badge>
                      )}
                      {displayStatus === 'overdue' && (
                        <Badge variant="destructive">Vencida</Badge>
                      )}
                      {inst.status === 'partial' && (
                        <Badge variant="warning">Parcial ({formatCurrency(inst.paid_amount || 0)})</Badge>
                      )}

                      {(inst.status === 'pending' || inst.status === 'partial') && isAdmin && plan.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markPaidMut.mutate({ id: inst.id, amount: inst.amount })}
                          disabled={markPaidMut.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Marcar Pagada
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
