import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import {
  useMorosoMembers,
  useComputeMorosoStatus,
  useNotifyMorosos,
  useMemberDebt,
  useMorosoNotices,
  useCreateMorosoNotice,
  useAcknowledgeMorosoNotice,
  useResolveMorosoNotice,
} from '../hooks/useMoroso'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatDate, formatCurrency } from '@/shared/lib/utils'
import { AlertTriangle, RefreshCw, Bell, Ban, UserX, UsersRound, CheckCircle, FileText, Plus, CheckCheck } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import type { Member, MorosoNoticeType } from '../types'

/** Member with moroso timestamps from member_profiles / view */
type MorosoMember = Member & { moroso_since?: string; moroso_notified_at?: string }

// ---------------------------------------------------------------------------
// Restriction labels
// ---------------------------------------------------------------------------

const restrictionLabels: Record<string, string> = {
  vote: 'No vota',
  be_elected: 'No elegible',
  quorum_excluded: 'Excluido quórum',
}

const restrictionIcons: Record<string, typeof Ban> = {
  vote: Ban,
  be_elected: UserX,
  quorum_excluded: UsersRound,
}

// ---------------------------------------------------------------------------
// Single row sub-component (fetches debt per member)
// ---------------------------------------------------------------------------

function MorosoRow({ member, onRegisterPayment }: { member: MorosoMember; onRegisterPayment?: (memberId: string) => void }) {
  const { data: debt, isLoading } = useMemberDebt(member.id)

  return (
    <TableRow>
      <TableCell className="font-medium">
        {member.full_name ?? member.email ?? member.id.slice(0, 8)}
      </TableCell>
      <TableCell className="hidden md:table-cell text-center">
        {isLoading ? '...' : debt?.ordinary_unpaid ?? 0}
      </TableCell>
      <TableCell className="hidden md:table-cell text-center">
        {isLoading ? '...' : debt?.extraordinary_unpaid ?? 0}
      </TableCell>
      <TableCell className="text-right">
        {isLoading ? '...' : formatCurrency(debt?.total_debt ?? 0)}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDate(member.moroso_since ?? '')}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {member.moroso_notified_at
          ? formatDate(member.moroso_notified_at)
          : <span className="text-muted-foreground text-xs">Sin notificar</span>}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {(debt?.restrictions ?? []).map((r: string) => {
            const Icon = restrictionIcons[r]
            return (
              <Badge
                key={r}
                variant="destructive"
                className="text-[10px] gap-0.5"
              >
                {Icon && <Icon className="h-2.5 w-2.5" />}
                {restrictionLabels[r] ?? r}
              </Badge>
            )
          })}
        </div>
      </TableCell>
      {onRegisterPayment && (
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRegisterPayment(member.id)}
            className="text-xs"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Registrar pago
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// MorosoAdminPanel
// ---------------------------------------------------------------------------

export function MorosoAdminPanel({ onRegisterPayment }: { onRegisterPayment?: (memberId: string) => void } = {}) {
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { data: morosos, isLoading, error } = useMorosoMembers()
  const { rules } = useRulesEngine()
  const computeMutation = useComputeMorosoStatus()
  const notifyMutation = useNotifyMorosos()
  const [lastResult, setLastResult] = useState<string | null>(null)

  const handleRecompute = async () => {
    setLastResult(null)
    try {
      const changes = await computeMutation.mutateAsync()
      if (changes.length === 0) {
        setLastResult('Sin cambios. Todos los standings ya estaban actualizados.')
      } else {
        setLastResult(`${changes.length} miembro(s) actualizados.`)
      }
    } catch {
      setLastResult('Error al recalcular. Intenta de nuevo.')
    }
  }

  const handleNotify = async () => {
    setLastResult(null)
    try {
      await notifyMutation.mutateAsync()
      setLastResult('Notificaciones enviadas. Se actualizó moroso_notified_at.')
    } catch {
      setLastResult('Error al notificar. Intenta de nuevo.')
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Cargando morosos..." className="py-10" />
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Morosos — LPCI Art. 2, 36
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecompute}
              disabled={computeMutation.isPending}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${computeMutation.isPending ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(path('treasury'), {
                  state: { mainSection: 'programacion', programacionTab: 'payment-plans' },
                })
              }
            >
              Gestionar planes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNotify}
              disabled={notifyMutation.isPending || !morosos?.length}
            >
              <Bell className="mr-1.5 h-3.5 w-3.5" />
              Notificar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thresholds info */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            Umbral ordinarias: <span className="font-semibold text-foreground">{rules.identity.moroso_threshold_ordinary}</span> cuotas
          </span>
          <span>
            Umbral extraordinarias: <span className="font-semibold text-foreground">{rules.identity.moroso_threshold_extraordinary}</span> cuota(s)
          </span>
          <span>
            Aviso previo: <span className="font-semibold text-foreground">{rules.identity.moroso_notice_days}</span> días
          </span>
          <span>
            Auto-restaurar: <Badge variant={rules.identity.auto_restore_on_payment ? 'success' : 'secondary'} className="text-[10px]">
              {rules.identity.auto_restore_on_payment ? 'Sí' : 'No'}
            </Badge>
          </span>
        </div>

        {/* Status message */}
        {lastResult && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            {lastResult}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            Error al cargar morosos: {(error as Error).message}
          </div>
        )}

        {/* Table */}
        {morosos && morosos.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Ord. pendientes</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Ext. pendientes</TableHead>
                  <TableHead className="text-right">Deuda total</TableHead>
                  <TableHead className="hidden sm:table-cell">Moroso desde</TableHead>
                  <TableHead className="hidden lg:table-cell">Notificado</TableHead>
                  <TableHead>Restricciones</TableHead>
                  {onRegisterPayment && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {morosos.map((member) => (
                  <MorosoRow key={member.id} member={member} onRegisterPayment={onRegisterPayment} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No hay miembros morosos actualmente.</p>
          </div>
        )}

        {morosos && morosos.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Total morosos: <span className="font-semibold">{morosos.length}</span>
          </p>
        )}
      </CardContent>
    </Card>

    {/* Moroso Notices Section */}
    <MorosoNoticesPanel morosos={morosos ?? []} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Notices panel
// ---------------------------------------------------------------------------

const NOTICE_TYPE_LABELS: Record<MorosoNoticeType, string> = {
  pre_assembly: 'Pre-asamblea',
  warning: 'Advertencia',
  suspension: 'Suspensión',
}

const NOTICE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline'> = {
  pending: 'warning',
  acknowledged: 'secondary',
  resolved: 'success',
  expired: 'outline',
}

function MorosoNoticesPanel({ morosos }: { morosos: MorosoMember[] }) {
  const toast = useToast()
  const { data: notices, isLoading } = useMorosoNotices()
  const createNotice = useCreateMorosoNotice()
  const ackNotice = useAcknowledgeMorosoNotice()
  const resolveNotice = useResolveMorosoNotice()

  const [showCreate, setShowCreate] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [noticeType, setNoticeType] = useState<MorosoNoticeType>('warning')
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleCreate = async () => {
    if (!selectedMemberId || !amount) return
    try {
      await createNotice.mutateAsync({
        memberId: selectedMemberId,
        noticeType,
        outstandingAmount: parseFloat(amount),
        opts: deadline ? { deadline } : undefined,
      })
      toast.success('Aviso creado.')
      setShowCreate(false)
      setSelectedMemberId('')
      setAmount('')
      setDeadline('')
    } catch {
      toast.error('No se pudo crear el aviso.')
    }
  }

  const handleAcknowledge = async (noticeId: string) => {
    try {
      await ackNotice.mutateAsync(noticeId)
      toast.success('Aviso acusado de recibo.')
    } catch {
      toast.error('Error al acusar recibo.')
    }
  }

  const handleResolve = async (noticeId: string) => {
    try {
      await resolveNotice.mutateAsync(noticeId)
      toast.success('Aviso resuelto.')
    } catch {
      toast.error('Error al resolver aviso.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-amber-500" />
            Avisos Morosos — Art. 59 LPCI
          </CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)} disabled={morosos.length === 0}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Crear aviso
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingSpinner message="Cargando avisos..." className="py-6" />
        ) : notices && notices.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto adeudado</TableHead>
                  <TableHead className="hidden sm:table-cell">Emitido</TableHead>
                  <TableHead className="hidden md:table-cell">Plazo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">
                      {n.member_name ?? n.member_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{NOTICE_TYPE_LABELS[n.notice_type] ?? n.notice_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(n.outstanding_amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(n.issued_at)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {n.deadline ? formatDate(n.deadline) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={NOTICE_STATUS_VARIANTS[n.status] ?? 'outline'}>{n.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {n.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(n.id)}
                            disabled={ackNotice.isPending}
                            className="text-xs"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Acusar
                          </Button>
                        )}
                        {(n.status === 'pending' || n.status === 'acknowledged') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(n.id)}
                            disabled={resolveNotice.isPending}
                            className="text-xs"
                          >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" />
            <p className="text-sm">No hay avisos registrados.</p>
          </div>
        )}
      </CardContent>

      {/* Create notice dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Crear aviso moroso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Miembro</Label>
              <Select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                <option value="">Seleccionar miembro...</option>
                {morosos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email ?? m.id.slice(0, 8)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de aviso</Label>
              <Select value={noticeType} onChange={(e) => setNoticeType(e.target.value as MorosoNoticeType)}>
                <option value="pre_assembly">Pre-asamblea</option>
                <option value="warning">Advertencia</option>
                <option value="suspension">Suspensión</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto adeudado</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Plazo (opcional)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!selectedMemberId || !amount || createNotice.isPending}>
              {createNotice.isPending ? 'Creando...' : 'Crear aviso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
