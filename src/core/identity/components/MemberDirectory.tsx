import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers, useUpdateMemberRole, useDeactivateMember, useReactivateMember } from '../hooks/useMembers'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Avatar } from '@/shared/components/ui/avatar'
import { Select } from '@/shared/components/ui/select'
import { InviteMemberDialog } from './InviteMemberDialog'
import { formatDate } from '@/shared/lib/utils'
import { useToast } from '@/shared/components/ui/toast'
import { hasPermission, type Role } from '@/shared/types'
import { UserPlus, UserMinus, UserCheck, Search } from 'lucide-react'

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  admin: 'default',
  tesorero: 'success',
  miembro: 'secondary',
  observador: 'outline',
}

const roleLabels: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  comite_vigilancia: 'Comité de Vigilancia',
  miembro: 'Miembro',
  observador: 'Observador',
}

export function MemberDirectory() {
  const navigate = useNavigate()
  const { data: members, isLoading } = useMembers()
  const updateRole = useUpdateMemberRole()
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Determine current user's role for permission checks
  const currentUserRole = members?.find((m) => m.is_current_user)?.role as Role | undefined
  const canManageMembers = currentUserRole ? hasPermission(currentUserRole, 'admin') : false

  const filteredMembers = members?.filter((m) => {
    if (search) {
      const q = search.toLowerCase()
      if (!(m.full_name?.toLowerCase().includes(q)) && !(m.email?.toLowerCase().includes(q)) && !(m.role?.toLowerCase().includes(q))) return false
    }
    if (roleFilter && m.role !== roleFilter) return false
    if (statusFilter && (m.status ?? 'active') !== statusFilter) return false
    return true
  }) ?? []

  if (isLoading) {
    return <LoadingSpinner message="Cargando miembros..." className="py-8" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 sm:max-w-2xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">Todos los roles</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-36">
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="pending">Pendiente</option>
          </Select>
        </div>
        {canManageMembers && (
          <Button onClick={() => setInviteOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar Miembro
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead className="hidden md:table-cell">Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead>Standing</TableHead>
              <TableHead className="hidden sm:table-cell">Desde</TableHead>
              {canManageMembers && <TableHead className="w-24">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow
                key={member.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/members/${member.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.full_name || member.email || '?'} size="sm" />
                    <span className="font-medium">{member.full_name || 'Sin nombre'}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  {canManageMembers && editingId === member.id ? (
                    <Select
                      value={member.role}
                      onChange={(e) => {
                        updateRole.mutate({ memberId: member.id, role: e.target.value as Role }, {
                          onSuccess: () => toast.success('Rol actualizado'),
                          onError: () => toast.error('Error al actualizar rol'),
                        })
                        setEditingId(null)
                      }}
                      onBlur={() => setEditingId(null)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-36"
                    >
                      <option value="admin">Administrador</option>
                      <option value="tesorero">Tesorero</option>
                      <option value="comite_vigilancia">Comité de Vigilancia</option>
                      <option value="miembro">Miembro</option>
                      <option value="observador">Observador</option>
                    </Select>
                  ) : (
                    <Badge
                      variant={roleBadgeVariant[member.role] || 'secondary'}
                      className={canManageMembers ? 'cursor-pointer' : ''}
                      onClick={(e) => { e.stopPropagation(); canManageMembers && setEditingId(member.id) }}
                    >
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
                    {member.status === 'active' ? 'Activo' : member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    member.financial_standing === 'good_standing' ? 'success' :
                    member.financial_standing === 'delinquent' || member.financial_standing === 'moroso' ? 'destructive' : 'warning'
                  }>
                    {member.financial_standing === 'good_standing' ? 'Al corriente' :
                     member.financial_standing === 'delinquent' || member.financial_standing === 'moroso' ? 'Moroso' :
                     member.financial_standing === 'grace_period' ? 'Gracia' : '—'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDate(member.joined_at)}
                </TableCell>
                {canManageMembers && (
                  <TableCell>
                    {!member.is_current_user && (
                      member.status === 'active' ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Desactivar miembro"
                          onClick={(e) => { e.stopPropagation(); deactivate.mutate(member.id, {
                            onSuccess: () => toast.success('Miembro desactivado'),
                            onError: () => toast.error('Error al desactivar miembro'),
                          }) }}
                          disabled={deactivate.isPending}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reactivar miembro"
                          onClick={(e) => { e.stopPropagation(); reactivate.mutate(member.id, {
                            onSuccess: () => toast.success('Miembro reactivado'),
                            onError: () => toast.error('Error al reactivar miembro'),
                          }) }}
                          disabled={reactivate.isPending}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManageMembers ? 7 : 6} className="text-center text-muted-foreground">
                  No hay miembros registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
