import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useUpdateMemberRole, useDeactivateMember, useReactivateMember } from '@/core/identity/hooks/useMembers'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Avatar } from '@/shared/components/ui/avatar'
import { Select } from '@/shared/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import {
  ArrowLeft, User, Wallet, Vote, Activity, Shield,
  UserMinus, UserCheck, AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react'
import type { Member } from '@/core/identity/types'
import type { Role } from '@/shared/types'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
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
}

const standingVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  good_standing: 'success',
  grace_period: 'warning',
  delinquent: 'destructive',
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

interface AuditEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { communityId } = useCommunityContext()
  const { canManageMembers } = usePermissions()
  const updateRole = useUpdateMemberRole()
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()

  const [member, setMember] = useState<Member | null>(null)
  const [obligations, setObligations] = useState<PaymentObligation[]>([])
  const [votes, setVotes] = useState<VoteRecord[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState(false)

  useEffect(() => {
    if (!memberId || !communityId) return

    let cancelled = false
    setLoading(true)

    async function fetchAll() {
      try {
        // Fetch member profile
        const { data: memberData, error: memberErr } = await (supabase
          .from('member_profiles' as any) as any)
          .select('*')
          .eq('id', memberId)
          .single()

        if (memberErr) {
          const { data: fallback, error: fbErr } = await supabase
            .from('members')
            .select('*')
            .eq('id', memberId!)
            .single()
          if (fbErr) throw fbErr
          if (!cancelled) setMember(fallback as Member)
        } else {
          if (!cancelled) setMember(memberData as Member)
        }

        const userId = memberData?.user_id || ((await supabase
          .from('members').select('user_id').eq('id', memberId!).single()
        ).data as any)?.user_id

        // Fetch payment obligations
        const { data: oblData } = await supabase
          .from('payment_obligations')
          .select('*')
          .eq('community_id', communityId!)
          .eq('member_id', memberId!)
          .order('due_date', { ascending: false })

        if (!cancelled) setObligations((oblData ?? []) as PaymentObligation[])

        // Fetch votes with proposal titles
        if (userId) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('*, proposals(title)')
            .eq('member_id', memberId!)

          if (!cancelled) {
            setVotes((voteData ?? []).map((v: any) => ({
              ...v,
              proposal_title: v.proposals?.title || 'Propuesta sin título',
            })) as VoteRecord[])
          }

          // Fetch audit log
          const { data: logData } = await supabase
            .from('audit_log')
            .select('*')
            .eq('community_id', communityId!)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30)

          if (!cancelled) setAuditLog((logData ?? []) as AuditEntry[])
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Error al cargar el miembro')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [memberId, communityId])

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
    await updateRole.mutateAsync({ memberId: member.id, role: newRole as Role })
    setMember(prev => prev ? { ...prev, role: newRole as Role } : null)
    setEditingRole(false)
  }

  const handleDeactivate = async () => {
    if (!confirm(`¿Desactivar a ${member.full_name || member.email}?`)) return
    await deactivate.mutateAsync(member.id)
    setMember(prev => prev ? { ...prev, status: 'inactive' as any } : null)
  }

  const handleReactivate = async () => {
    await reactivate.mutateAsync(member.id)
    setMember(prev => prev ? { ...prev, status: 'active' as any } : null)
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
                  <option value="admin">Administrador</option>
                  <option value="tesorero">Tesorero</option>
                  <option value="miembro">Miembro</option>
                  <option value="observador">Observador</option>
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
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map(obl => (
                    <TableRow key={obl.id}>
                      <TableCell className="font-medium">{obl.concept || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(obl.due_date)}</TableCell>
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
                      <TableCell className="text-muted-foreground">
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
                    <TableHead>Peso</TableHead>
                    <TableHead>Fecha</TableHead>
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
                      <TableCell>{v.weight}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(v.created_at)}</TableCell>
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
