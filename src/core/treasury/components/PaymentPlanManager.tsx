import { useState } from 'react'
import {
  usePaymentPlans,
  useInstallments,
  useApprovePaymentPlan,
  useCancelPaymentPlan,
  useMarkInstallmentPaid,
} from '../hooks/usePaymentPlans'
import { useAuth } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useToast } from '@/shared/components/ui/toast'
import { cn } from '@/shared/lib/utils'
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react'
import type { PaymentPlan } from '../services/payment-plan.service'

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: typeof Clock }> = {
  proposed: { label: 'Propuesto', variant: 'secondary', icon: Clock },
  active: { label: 'Activo', variant: 'default', icon: CreditCard },
  completed: { label: 'Completado', variant: 'success', icon: CheckCircle2 },
  defaulted: { label: 'Incumplido', variant: 'destructive', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', variant: 'outline', icon: XCircle },
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

export function PaymentPlanManager() {
  const { data: plans, isLoading } = usePaymentPlans()
  const { isAdmin } = usePermissions()

  if (isLoading) return <LoadingSpinner message="Cargando planes..." className="py-6" />

  const activePlans = (plans ?? []).filter((p) => p.status === 'active' || p.status === 'proposed')
  const historicPlans = (plans ?? []).filter((p) => !['active', 'proposed'].includes(p.status))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Planes de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePlans.length === 0 && historicPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay planes de pago registrados.
            </p>
          ) : (
            <>
              {activePlans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} isAdmin={isAdmin} />
              ))}
              {historicPlans.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Histórico</p>
                  {historicPlans.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} isAdmin={isAdmin} />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PlanRow({ plan, isAdmin }: { plan: PaymentPlan; isAdmin: boolean }) {
  const { user } = useAuth()
  const toast = useToast()
  const approveMut = useApprovePaymentPlan()
  const cancelMut = useCancelPaymentPlan()
  const [expanded, setExpanded] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  const statusCfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.proposed
  const StatusIcon = statusCfg.icon

  const handleApprove = () => {
    if (!user) return
    approveMut.mutate(
      { planId: plan.id, approvedBy: user.id },
      {
        onSuccess: () => toast.success('Plan aprobado — parcialidades generadas'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al aprobar'),
      }
    )
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) return
    cancelMut.mutate(
      { planId: plan.id, reason: cancelReason },
      {
        onSuccess: () => {
          toast.success('Plan cancelado')
          setShowCancelForm(false)
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al cancelar'),
      }
    )
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-4 w-4', statusCfg.variant === 'destructive' ? 'text-red-500' : 'text-blue-500')} />
            <span className="text-sm font-medium">
              ${plan.total_debt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <Badge variant={statusCfg.variant as any} className="text-[10px]">
              {statusCfg.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {plan.number_of_installments} pagos de ${plan.installment_amount.toLocaleString('es-MX')} ({FREQUENCY_LABELS[plan.frequency]})
            {' · '}Inicio: {new Date(plan.start_date).toLocaleDateString('es-MX')}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {plan.status === 'proposed' && isAdmin && (
            <>
              <Button size="sm" variant="outline" onClick={handleApprove} disabled={approveMut.isPending}>
                {approveMut.isPending ? '...' : 'Aprobar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCancelForm(!showCancelForm)} className="text-destructive">
                Rechazar
              </Button>
            </>
          )}
          {(plan.status === 'active' || plan.status === 'proposed') && isAdmin && plan.status !== 'proposed' && (
            <Button size="sm" variant="ghost" onClick={() => setShowCancelForm(!showCancelForm)} className="text-destructive text-xs">
              Cancelar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Cancel form */}
      {showCancelForm && (
        <div className="flex items-center gap-2 border-t pt-2">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Razón de cancelación..."
            className="flex-1 h-8 text-xs"
          />
          <Button size="sm" variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim() || cancelMut.isPending}>
            {cancelMut.isPending ? '...' : 'Confirmar'}
          </Button>
        </div>
      )}

      {/* Installments detail */}
      {expanded && plan.status === 'active' && (
        <InstallmentsList planId={plan.id} isAdmin={isAdmin} />
      )}

      {plan.notes && expanded && (
        <p className="text-xs text-muted-foreground border-t pt-2">Notas: {plan.notes}</p>
      )}
    </div>
  )
}

function InstallmentsList({ planId, isAdmin }: { planId: string; isAdmin: boolean }) {
  const { data: installments, isLoading } = useInstallments(planId)
  const markPaid = useMarkInstallmentPaid()
  const toast = useToast()

  if (isLoading) return <p className="text-xs text-muted-foreground">Cargando parcialidades...</p>

  return (
    <div className="border-t pt-2 space-y-1">
      {(installments ?? []).map((inst) => {
        const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date()
        return (
          <div
            key={inst.id}
            className={cn(
              'flex items-center justify-between text-xs rounded px-2 py-1',
              inst.status === 'paid' && 'bg-green-50',
              isOverdue && 'bg-red-50',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6">#{inst.installment_number}</span>
              <span className={cn(inst.status === 'paid' && 'line-through text-muted-foreground')}>
                ${inst.amount.toLocaleString('es-MX')}
              </span>
              <span className="text-muted-foreground">
                {new Date(inst.due_date).toLocaleDateString('es-MX')}
              </span>
              {isOverdue && <Badge variant="destructive" className="text-[9px]">Vencida</Badge>}
              {inst.status === 'paid' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            </div>
            {inst.status !== 'paid' && isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() =>
                  markPaid.mutate(
                    { installmentId: inst.id, paidAmount: inst.amount },
                    {
                      onSuccess: () => toast.success(`Parcialidad #${inst.installment_number} pagada`),
                      onError: () => toast.error('Error al registrar pago'),
                    }
                  )
                }
                disabled={markPaid.isPending}
              >
                <DollarSign className="h-3 w-3 mr-0.5" />
                Pagar
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
