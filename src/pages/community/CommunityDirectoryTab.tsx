import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Avatar } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Card } from '@/shared/components/ui/card'
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from '@/shared/constants/roles'
import { Search, Mail } from 'lucide-react'
import type { Role } from '@/shared/types'

export function CommunityDirectoryTab() {
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { data: members, isLoading } = useMembers()
  const [search, setSearch] = useState('')

  if (isLoading) return <LoadingSpinner className="py-12" />

  const activeMembers = (members ?? []).filter((m) => m.status === 'active')
  const filtered = search.trim()
    ? activeMembers.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email?.toLowerCase().includes(search.toLowerCase()) ||
          m.role?.toLowerCase().includes(search.toLowerCase()),
      )
    : activeMembers

  return (
    <div className="space-y-4 mt-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar miembro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No se encontraron miembros.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Card
              key={member.id}
              className="flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-muted/50"
              onClick={() => navigate(path(`members/${member.id}`))}
            >
              <Avatar
                name={member.full_name || member.email || '?'}
                size="lg"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold">
                  {member.full_name || 'Sin nombre'}
                </p>
                <Badge variant={ROLE_BADGE_VARIANT[member.role as Role] ?? 'secondary'} className="text-xs">
                  {ROLE_LABELS[member.role] || member.role}
                </Badge>
                {member.email && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    {member.email}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
