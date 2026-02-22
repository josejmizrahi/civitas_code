import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useRoles } from '@/core/identity/hooks/useRoles'
import { useMember, useUpdateMemberRole, useDeactivateMember, useReactivateMember } from '@/core/identity/hooks/useMembers'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { getAuditLog } from '@/shared/services/audit.service'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Avatar } from '@/shared/components/ui/avatar'
import { Select } from '@/shared/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import { useToast } from '@/shared/components/ui/toast'
import {
  ArrowLeft, Wallet, Vote, Activity, Shield,
  UserMinus, UserCheck, AlertCircle, CheckCircle, Clock,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_BADGE_VARIANT, STANDING_LABELS, STANDING_BADGE_VARIANT } from '@/shared/constants/roles'
import { useConfirm } from '@/shared/components/ConfirmDialog'

interface PaymentObligation {
  id: string
  concept: string
  amount: number
  due_date: string
  status: string
  paid_at?: string | null
}

interface VoteRecord {
  id: string
  proposal_id: string
  vote: string
  weight: number
  created_at: string
  proposal_title?: string
}

async function fetchMemberVotes(memberId: string): Promise<VoteRecord[]> {
  const { data } = await supabase
    .from('votes')
    .select('*, proposals(title)')
    .eq('member_id', memberId)
  return (data ?? []).map((v: any) => ({
    ...v,
    proposal_title: v.proposals?.title || 'Propuesta sin título',
  })) as VoteRecord[]
}

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { communityId } = useCommunityContext()
  const { canManageMembers } = usePermissions()
  const { data: roles } = useRoles()
  const updateRole = useUpdateMemberRole()
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const [editingRole, setEditingRole] = useState(false)

  const { error: toastError, success: toastSuccess } = useToast()
  const confirm = useConfirm()
  const memberQuery = useMember(memberId)
  const obligationsQuery = usePaymentObligations(memberId)
  const votesQuery = useQuery({
    queryKey: ['member-votes', memberId],
    queryFn: () => fetchMemberVotes(memberId!),
    enabled: !!memberId,
  })
  const auditQuery = useQuery({
    queryKey: ['audit-log', communityId, memberQuery.data?.user_id],
    queryFn: () => getAuditLog(communityId!, { userId: memberQuery.data!.user_id!, limit: 30 }),
    enabled: !!communityId && !!memberQuery.data?.user_id,
  })

  useEffect(() => {
    if (auditQuery.isError && auditQuery.error) {
      toastError(auditQuery.error instanceof Error ? auditQuery.error.message : 'Error al cargar historial')
    }
  }, [auditQuery.isError, auditQuery.error, toastError])

  const member = memberQuery.data
  const loading = memberQuery.isLoading
  const error = memberQuery.error ? (memberQuery.error as Error).message : null
  const obligations = (obligationsQuery.data ?? []) as PaymentObligation[]
  const votes = (votesQuery.data ?? []) as VoteRecord[]
  const auditLog = auditQuery.data ?? []

  if (loading) return <LoadingSpinner message="Cargando perfil del miembro..." className="py-20" />

  if (error || !member) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Miembro no encontrado'}</span>
        </div>
      </div>
    )
  }

  const totalPaid = obligations.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.amount), 0)
  const totalPending = obligations.filter(o => o.status !== 'paid').reduce((sum, o) => sum + Number(o.amount), 0)
  const overdueCount = obligations.filter(o => o.status === 'overdue' || (o.status === 'pending' && new Date(o.due_date) < new Date())).length

  const handleRoleChange = async (newRole: string) => {
    try {
      await updateRole.mutateAsync({ memberId: member.id, role: newRole })
      toastSuccess('Rol actualizado correctamente')
      setEditingRole(false)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al cambiar el rol')
    }
  }

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: 'Desactivar miembro',
      description: `¿Estás seguro de desactivar a ${member.full_name || member.email}? Ya no podrá acceder a la comunidad.`,
      confirmLabel: 'Desactivar',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      await deactivate.mutateAsync(member.id)
      toastSuccess('Miembro desactivado')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al desactivar miembro')
    }
  }

  const handleReactivate = async () => {
    try {
      await reactivate.mutateAsync(member.id)
      toastSuccess('Miembro reactivado')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al reactivar miembro')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/members')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver a Miembros
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={member.full_name || member.email || '?'} size="lg" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{member.full_name || 'Sin nombre'}</h1>
                <p className="text-sm text-muted-foreground">{member.email || 'Sin email'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Miembro desde {formatDate(member.joined_at || member.created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editingRole && canManageMembers ? (
                <Select
                  value={member.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  onBlur={() => setEditingRole(false)}
                  className="w-40"
                >
                  {(roles ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              ) : (
                <Badge
                  variant={ROLE_BADGE_VARIANT[member.role] || 'secondary'}
                  className={canManageMembers ? 'cursor-pointer text-sm' : 'text-sm'}
                  onClick={() => canManageMembers && setEditingRole(true)}
                >
                  {ROLE_LABELS[member.role] || member.role}
                </Badge>
              )}
              <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
                {member.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant={STANDING_BADGE_VARIANT[member.financial_standing] || 'success'}>
                {STANDING_LABELS[member.financial_standing] || member.financial_standing || 'Al corriente'}
              </Badge>
            </div>
          </div>

          {/* Admin actions */}
          {canManageMembers && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {member.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeactivate}
                  disabled={deactivate.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Desactivar miembro
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={reactivate.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivar miembro
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRole(true)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Cambiar rol
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate('/treasury', {
                    state: { mainSection: 'programacion', programacionTab: 'payment-plans' },
                  })
                }
              >
                <Wallet className="mr-2 h-4 w-4" />
                Gestionar plan de pago
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {obligations.filter(o => o.status === 'paid').length} pagos realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {obligations.filter(o => o.status !== 'paid').length} pagos pendientes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participación</CardTitle>
            <Vote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{votes.length}</div>
            <p className="text-xs text-muted-foreground">
              votos emitidos{overdueCount > 0 ? ` · ${overdueCount} vencido${overdueCount > 1 ? 's' : ''}` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Obligations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Obligaciones de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obligations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin obligaciones de pago registradas.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="hidden sm:table-cell">Vencimiento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map(obl => (
                    <TableRow key={obl.id}>
                      <TableCell className="font-medium">{obl.concept || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(obl.due_date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(obl.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={
                          obl.status === 'paid' ? 'success' :
                          obl.status === 'overdue' ? 'destructive' : 'secondary'
                        }>
                          {obl.status === 'paid' ? 'Pagado' :
                           obl.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {obl.paid_at ? formatDate(obl.paid_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Vote className="h-4 w-4" />
            Historial de Votos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {votes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin votos registrados.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propuesta</TableHead>
                    <TableHead>Voto</TableHead>
                    <TableHead className="hidden sm:table-cell">Peso</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votes.map(v => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/governance/${v.proposal_id}`)}
                    >
                      <TableCell className="font-medium">{v.proposal_title}</TableCell>
                      <TableCell>
                        <Badge variant={
                          v.vote === 'yes' ? 'success' :
                          v.vote === 'no' ? 'destructive' : 'secondary'
                        }>
                          {v.vote === 'yes' ? 'A favor' :
                           v.vote === 'no' ? 'En contra' : 'Abstención'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{v.weight}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(v.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <div className="space-y-3">
              {auditLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p>
                      <span className="font-medium capitalize">{entry.action}</span>
                      {' '}
                      <span className="text-muted-foreground">{entry.entity_type}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
