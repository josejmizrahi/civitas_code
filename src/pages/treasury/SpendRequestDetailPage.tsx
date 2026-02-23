import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import {
  useSpendRequest,
  useSubmitSpendRequest,
  useApproveSpendRequest,
  useRejectSpendRequest,
  useExecuteSpendRequest,
  useVerifySpendRequest,
  useCancelSpendRequest,
} from '@/core/treasury/hooks/useSpendRequests'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useToast } from '@/shared/components/ui/toast'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Send,
  Banknote,
  ShieldCheck,
  Ban,
} from 'lucide-react'
import type { SpendRequestStatus } from '@/core/treasury/types'

const STATUS_LABELS: Record<SpendRequestStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente aprobación',
  pending_vote: 'Pendiente votación',
  approved: 'Aprobado',
  executing: 'Ejecutando',
  executed: 'Ejecutado',
  verified: 'Verificado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'N1 Presupuesto',
  2: 'N2 Discrecional',
  3: 'N3 Votación',
  4: 'N4 Emergencia',
}

export function SpendRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const { canManageTreasury, role, isAdmin } = usePermissions()

  const { data: sr, isLoading } = useSpendRequest(id ?? null)
  const submitSpendRequest = useSubmitSpendRequest()
  const approveSpendRequest = useApproveSpendRequest()
  const rejectSpendRequest = useRejectSpendRequest()
  const executeSpendRequest = useExecuteSpendRequest()
  const verifySpendRequest = useVerifySpendRequest()
  const cancelSpendRequest = useCancelSpendRequest()

  const [approvalNote, setApprovalNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showExecute, setShowExecute] = useState(false)

  const canApprove = (role === 'comite_vigilancia' || isAdmin) && sr?.status === 'pending_approval'
  const canExecute = canManageTreasury && sr?.status === 'approved'
  const canVerify = (role === 'comite_vigilancia' || isAdmin) && sr?.status === 'executed'
  const canSubmit = canManageTreasury && sr?.status === 'draft' && user?.id
  const canCancel = canManageTreasury && (sr?.status === 'draft' || sr?.status === 'rejected') && user?.id

  const handleSubmit = async () => {
    if (!sr || !user?.id) return
    try {
      await submitSpendRequest.mutateAsync({ spendRequestId: sr.id, requestedByUserId: user.id })
      toast.success('Solicitud enviada.')
    } catch {
      toast.error('No se pudo enviar.')
    }
  }

  const handleApprove = async () => {
    if (!sr || !user?.id) return
    try {
      await approveSpendRequest.mutateAsync({
        spendRequestId: sr.id,
        approvedByUserId: user.id,
        note: approvalNote,
      })
      toast.success('Solicitud aprobada.')
      setApprovalNote('')
    } catch {
      toast.error('No se pudo aprobar.')
    }
  }

  const handleReject = async () => {
    if (!sr || !user?.id || !rejectionReason.trim()) {
      toast.error('Escribe el motivo del rechazo.')
      return
    }
    try {
      await rejectSpendRequest.mutateAsync({
        spendRequestId: sr.id,
        rejectedByUserId: user.id,
        reason: rejectionReason.trim(),
      })
      toast.success('Solicitud rechazada.')
      setShowReject(false)
      setRejectionReason('')
    } catch {
      toast.error('No se pudo rechazar.')
    }
  }

  const handleExecute = async () => {
    if (!sr || !user?.id) return
    try {
      await executeSpendRequest.mutateAsync({
        spendRequestId: sr.id,
        executedByUserId: user.id,
        paymentReference: paymentRef.trim() || undefined,
      })
      toast.success('Pago registrado.')
      setShowExecute(false)
      setPaymentRef('')
    } catch {
      toast.error('No se pudo registrar el pago.')
    }
  }

  const handleVerify = async () => {
    if (!sr || !user?.id) return
    try {
      await verifySpendRequest.mutateAsync({
        spendRequestId: sr.id,
        verifiedByUserId: user.id,
        note: verifyNote,
      })
      toast.success('Solicitud verificada.')
      setVerifyNote('')
    } catch {
      toast.error('No se pudo verificar.')
    }
  }

  const handleCancel = async () => {
    if (!sr || !user?.id) return
    try {
      await cancelSpendRequest.mutateAsync({
        spendRequestId: sr.id,
        cancelledByUserId: user.id,
      })
      toast.success('Solicitud cancelada.')
      navigate('/treasury/requests')
    } catch {
      toast.error('No se pudo cancelar.')
    }
  }

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!sr) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Solicitud no encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/treasury/requests')}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/treasury/requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{sr.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge>{STATUS_LABELS[sr.status]}</Badge>
            {sr.authorization_level != null && (
              <Badge variant="secondary">{LEVEL_LABELS[sr.authorization_level] ?? `N${sr.authorization_level}`}</Badge>
            )}
            {sr.is_emergency && <Badge variant="destructive">Emergencia</Badge>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Detalle</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Monto</dt>
              <dd className="font-medium">{formatCurrency(sr.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Categoría</dt>
              <dd>{sr.category_name ?? sr.category_id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fondo</dt>
              <dd>{sr.fund}</dd>
            </div>
            {sr.description && (
              <div>
                <dt className="text-muted-foreground">Descripción</dt>
                <dd className="whitespace-pre-wrap">{sr.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Creado</dt>
              <dd>{formatDate(sr.created_at)}</dd>
            </div>
            {sr.paid_at && (
              <div>
                <dt className="text-muted-foreground">Pagado</dt>
                <dd>{formatDate(sr.paid_at)}</dd>
              </div>
            )}
            {sr.transaction_id && (
              <div>
                <dt className="text-muted-foreground">Transacción</dt>
                <dd className="font-mono text-xs">{sr.transaction_id}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Acciones</h3>
          <div className="flex flex-col gap-2">
            {canSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={submitSpendRequest.isPending}
                className="gap-2"
              >
                {submitSpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar solicitud
              </Button>
            )}
            {canApprove && (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nota de aprobación (opcional)"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                  />
                  <Button
                    onClick={handleApprove}
                    disabled={approveSpendRequest.isPending}
                    className="gap-1 shrink-0"
                  >
                    {approveSpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Aprobar
                  </Button>
                </div>
                {!showReject ? (
                  <Button variant="outline" onClick={() => setShowReject(true)} className="gap-1">
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                ) : (
                  <div className="space-y-2 rounded border p-2">
                    <Label>Motivo del rechazo</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Obligatorio"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReject}
                        disabled={rejectSpendRequest.isPending || !rejectionReason.trim()}
                      >
                        Confirmar rechazo
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {canExecute && (
              <>
                {!showExecute ? (
                  <Button onClick={() => setShowExecute(true)} className="gap-2">
                    <Banknote className="h-4 w-4" />
                    Registrar pago
                  </Button>
                ) : (
                  <div className="space-y-2 rounded border p-2">
                    <Label>Referencia de pago (opcional)</Label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Ej. Transferencia 123"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleExecute} disabled={executeSpendRequest.isPending} className="gap-1">
                        {executeSpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Confirmar pago
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowExecute(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {canVerify && (
              <div className="flex gap-2">
                <Input
                  placeholder="Nota de verificación (opcional)"
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                />
                <Button
                  onClick={handleVerify}
                  disabled={verifySpendRequest.isPending}
                  className="gap-1 shrink-0"
                >
                  {verifySpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verificar
                </Button>
              </div>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelSpendRequest.isPending}
                className="gap-1 text-destructive"
              >
                <Ban className="h-4 w-4" />
                Cancelar solicitud
              </Button>
            )}
            {sr.status === 'pending_vote' && sr.proposal_id && (
              <Button
                variant="outline"
                onClick={() => navigate(`/governance/${sr.proposal_id}`)}
                className="gap-1"
              >
                Ver propuesta
              </Button>
            )}
          </div>
        </div>
      </div>

      {(sr.rejection_reason || sr.approval_note || sr.verification_note) && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          {sr.rejection_reason && (
            <p><span className="font-medium text-destructive">Rechazo:</span> {sr.rejection_reason}</p>
          )}
          {sr.approval_note && (
            <p><span className="font-medium">Aprobación:</span> {sr.approval_note}</p>
          )}
          {sr.verification_note && (
            <p><span className="font-medium">Verificación:</span> {sr.verification_note}</p>
          )}
        </div>
      )}
    </div>
  )
}
