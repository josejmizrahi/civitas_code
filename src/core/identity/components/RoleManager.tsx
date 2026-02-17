import { useUpdateMemberRole } from '../hooks/useMembers'
import { Select } from '@/shared/components/ui/select'
import type { Role } from '@/shared/types'

interface RoleManagerProps {
  memberId: string
  currentRole: Role
}

export function RoleManager({ memberId, currentRole }: RoleManagerProps) {
  const updateRole = useUpdateMemberRole()

  return (
    <Select
      value={currentRole}
      onChange={(e) => updateRole.mutate({ memberId, role: e.target.value as Role })}
      className="w-40"
    >
      <option value="admin">Administrador</option>
      <option value="tesorero">Tesorero</option>
      <option value="miembro">Miembro</option>
      <option value="observador">Observador</option>
    </Select>
  )
}
