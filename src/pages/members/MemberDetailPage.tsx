import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useRoles } from '@/core/identity/hooks/useRoles'
import { useMember, useUpdateMemberRole, useUpdateMemberCustomAttributes, useDeactivateMember, useReactivateMember } from '@/core/identity/hooks/useMembers'
import { useCommunityConfig } from '@/shared/hooks/useCommunityConfig'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { getAuditLog } from '@/shared/services/audit.service'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Avatar } from '@/shared/components/ui/avatar'
import { Select } from '@/shared/components/ui/select'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import { useToast } from '@/shared/components/ui/toast'
import {
  ArrowLeft, Wallet, Vote, Activity, Shield, FileText,
  UserMinus, UserCheck, AlertCircle, CheckCircle, Clock,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  comite_vigilancia: 'Comité de Vigilancia',
  miembro: 'Miembro',
  observador: 'Observador',
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  admin: 'default',
  tesorero: 'success',
  miembro: 'secondary',
  observador: 'outline',
}

const standingLabels: Record<string, string> = {
  good_standing: 'Al día',
  grace_period: 'Período de gracia',
  delinquent: 'Moroso',
  moroso: 'Moroso',
}

const standingVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  good_standing: 'success',
  grace_period: 'warning',
  delinquent: 'destructive',
  moroso: 'destructive',
}

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
    vote: v.value ?? v.vote,
    proposal_title: v.proposals?.title || 'Propuesta sin título',
  })) as VoteRecord[]
}

async function fetchMemberProposals(communityId: string, userId: string): Promise<Array<{ id: string; title: string; status: string; created_at: string }>> {
  const { data } = await supabase
    .from('proposals')
    .select('id, title, status, created_at')
    .eq('community_id', communityId)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Array<{ id: string; title: string; status: string; created_at: string }>
}

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { communityId } = useCommunityContext()
  const { canManageMembers } = usePermissions()
  const { data: roles } = useRoles()
  const updateRole = useUpdateMemberRole()
  const updateCustomAttrs = useUpdateMemberCustomAttributes()
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const { membershipAttributes } = useCommunityConfig()
  const [editingRole, setEditingRole] = useState(false)
  const [activeTab, setActiveTab] = useState<'pagos' | 'propuestas' | 'votos' | 'actividad'>('pagos')
  const [editingAttrs, setEditingAttrs] = useState(false)
  const [attrDraft, setAttrDraft] = useState<Record<string, unknown>>({})

  const { error: toastError, success: toastSuccess } = useToast()
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
  const proposalsQuery = useQuery({
    queryKey: ['member-proposals', communityId, memberQuery.data?.user_id],
    queryFn: () => fetchMemberProposals(communityId!, memberQuery.data!.user_id!),
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
  const memberProposals = proposalsQuery.data ?? []

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
    if (!confirm(`¿Desactivar a ${member.full_name || member.email}?`)) return
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
                  variant={roleBadgeVariant[member.role] || 'secondary'}
                  className={canManageMembers ? 'cursor-pointer text-sm' : 'text-sm'}
                  onClick={() => canManageMembers && setEditingRole(true)}
                >
                  {roleLabels[member.role] || member.role}
                </Badge>
              )}
              <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
                {member.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant={standingVariant[member.financial_standing] || 'success'}>
                {standingLabels[member.financial_standing] || member.financial_standing || 'Al día'}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['pagos', 'propuestas', 'votos', 'actividad'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'pagos' && <Wallet className="mr-1 h-3 w-3" />}
            {tab === 'propuestas' && <FileText className="mr-1 h-3 w-3" />}
            {tab === 'votos' && <Vote className="mr-1 h-3 w-3" />}
            {tab === 'actividad' && <Activity className="mr-1 h-3 w-3" />}
            {tab === 'pagos' ? 'Pagos' : tab === 'propuestas' ? 'Propuestas' : tab === 'votos' ? 'Votos' : 'Actividad'}
          </Button>
        ))}
      </div>

      {/* Atributos personalizados (solo admin) */}
      {canManageMembers && membershipAttributes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atributos personalizados</CardTitle>
          </CardHeader>
          <CardContent>
            {editingAttrs ? (
              <div className="space-y-3">
                {membershipAttributes.map((attr) => (
                  <div key={attr.key}>
                    <Label className="text-sm">{attr.label}</Label>
                    <Input
                      className="mt-1"
                      value={String(attrDraft[attr.key] ?? '')}
                      onChange={(e) => setAttrDraft(prev => ({ ...prev, [attr.key]: e.target.value }))}
                      type={attr.type === 'number' || attr.type === 'decimal' ? 'number' : 'text'}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateCustomAttrs.mutate(
                      { memberId: member.id, custom_attributes: attrDraft },
                      {
                        onSuccess: () => { toastSuccess('Atributos actualizados'); setEditingAttrs(false); memberQuery.refetch() },
                        onError: (err) => toastError(err instanceof Error ? err.message : 'Error al guardar'),
                      },
                    )}
                    disabled={updateCustomAttrs.isPending}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingAttrs(false); setAttrDraft({}) }}>Cerrar</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {membershipAttributes.map((attr) => (
                  <span key={attr.key} className="text-sm">
                    <span className="text-muted-foreground">{attr.label}:</span>{' '}
                    {(member.custom_attributes as Record<string, unknown>)?.[attr.key] != null
                      ? String((member.custom_attributes as Record<string, unknown>)[attr.key])
                      : '—'}
                  </span>
                ))}
                <Button size="sm" variant="ghost" onClick={() => { setAttrDraft({ ...(member.custom_attributes as Record<string, unknown> ?? {}) }); setEditingAttrs(true) }}>Editar</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Tab content: Pagos */}
      {activeTab === 'pagos' && (
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
      )}

      {/* Tab content: Propuestas creadas */}
      {activeTab === 'propuestas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Propuestas creadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin propuestas creadas.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberProposals.map(p => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/governance/${p.id}`)}
                      >
                        <TableCell className="font-medium">{p.title || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'executed' ? 'success' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab content: Votos */}
      {activeTab === 'votos' && (
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
      )}

      {/* Tab content: Actividad */}
      {activeTab === 'actividad' && (
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
      )}
    </div>
  )
}
