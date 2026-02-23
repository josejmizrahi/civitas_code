import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers, useUpdateMemberRole, useDeactivateMember, useReactivateMember } from '../hooks/useMembers'
import { usePermissions } from '@/shared/hooks/usePermissions'
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
import { useRoles } from '@/core/identity/hooks/useRoles'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { ROLE_LABELS, ROLE_BADGE_VARIANT, STANDING_LABELS, STANDING_BADGE_VARIANT } from '@/shared/constants/roles'
import { UserPlus, UserMinus, UserCheck, Search } from 'lucide-react'

export function MemberDirectory() {
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { data: roles } = useRoles()
  const { data: members, isLoading } = useMembers()
  const { canManageMembers } = usePermissions()
  const { t } = useI18n()
  const updateRole = useUpdateMemberRole()
  const deactivate = useDeactivateMember()
  const reactivate = useReactivateMember()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

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
    return <LoadingSpinner message={t('memberDir.loading')} className="py-8" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 sm:max-w-2xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('memberDir.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">{t('memberDir.allRoles')}</option>
            {(roles ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-36">
            <option value="">{t('memberDir.allStatuses')}</option>
            <option value="active">{t('memberDir.statusActive')}</option>
            <option value="inactive">{t('memberDir.statusInactive')}</option>
            <option value="pending">{t('memberDir.statusPending')}</option>
          </Select>
        </div>
        {canManageMembers && (
          <Button onClick={() => setInviteOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            {t('memberDir.invite')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('memberDir.col.member')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('memberDir.col.email')}</TableHead>
              <TableHead>{t('memberDir.col.role')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('memberDir.col.status')}</TableHead>
              <TableHead>{t('memberDir.col.standing')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('memberDir.col.since')}</TableHead>
              {canManageMembers && <TableHead className="w-24">{t('memberDir.col.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow
                key={member.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(path(`members/${member.id}`))}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.full_name || member.email || '?'} size="sm" />
                    <span className="font-medium">{member.full_name || t('memberDir.noName')}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  {canManageMembers && editingId === member.id ? (
                    <Select
                      value={member.role}
                      onChange={(e) => {
                        updateRole.mutate({ memberId: member.id, role: e.target.value }, {
                          onSuccess: () => toast.success(t('memberDir.roleUpdated')),
                          onError: () => toast.error(t('memberDir.roleError')),
                        })
                        setEditingId(null)
                      }}
                      onBlur={() => setEditingId(null)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-36"
                    >
                      {(roles ?? []).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </Select>
                  ) : (
                    <Badge
                      variant={ROLE_BADGE_VARIANT[member.role] || 'secondary'}
                      className={canManageMembers ? 'cursor-pointer' : ''}
                      onClick={(e) => { e.stopPropagation(); if (canManageMembers) setEditingId(member.id) }}
                    >
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
                    {member.status === 'active' ? t('memberDir.active') : member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STANDING_BADGE_VARIANT[member.financial_standing] || 'success'}>
                    {STANDING_LABELS[member.financial_standing] || '—'}
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
                          title={t('memberDir.deactivate')}
                          onClick={(e) => { e.stopPropagation(); deactivate.mutate(member.id, {
                            onSuccess: () => toast.success(t('memberDir.deactivated')),
                            onError: () => toast.error(t('memberDir.deactivateError')),
                          }) }}
                          disabled={deactivate.isPending}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t('memberDir.reactivate')}
                          onClick={(e) => { e.stopPropagation(); reactivate.mutate(member.id, {
                            onSuccess: () => toast.success(t('memberDir.reactivated')),
                            onError: () => toast.error(t('memberDir.reactivateError')),
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
                  {t('memberDir.empty')}
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
