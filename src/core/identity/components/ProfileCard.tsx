import { Avatar } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import type { Member } from '../types'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
  miembro: 'Miembro',
  observador: 'Observador',
}

interface ProfileCardProps {
  member: Member
}

export function ProfileCard({ member }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar name={member.full_name || member.email || '?'} size="lg" />
        <div>
          <h3 className="font-semibold">{member.full_name || 'Sin nombre'}</h3>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Badge>{roleLabels[member.role] || member.role}</Badge>
          <Badge variant={member.status === 'active' ? 'success' : 'outline'}>
            {member.status === 'active' ? 'Activo' : member.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
