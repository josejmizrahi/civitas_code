import { useState, useEffect, useMemo } from 'react'
import type { TemplateFieldsProps } from './types'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select } from '@/shared/components/ui/select'
import { useMembers } from '@/core/identity/hooks/useMembers'

const ROLES_WITH_OFFICE: Array<{ value: string; label: string }> = [
  { value: 'admin', label: 'Administrador' },
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'comite_vigilancia', label: 'Comité de Vigilancia' },
]

export function RemocionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const { data: members } = useMembers()
  const membersWithOffice = useMemo(
    () =>
      (members ?? []).filter(
        (m) =>
          m.status === 'active' &&
          m.role &&
          ROLES_WITH_OFFICE.some((r) => r.value === m.role),
      ),
    [members],
  )

  const [memberId, setMemberId] = useState(
    (initialData?.financialInstruction?.member_id as string) ?? '',
  )
  const [role, setRole] = useState(
    (initialData?.financialInstruction?.role as string) ?? 'admin',
  )
  const [justificacion, setJustificacion] = useState(
    (initialData?.description as string) ?? '',
  )

  const selectedMember = membersWithOffice.find((m) => m.id === memberId)
  const roleLabel = ROLES_WITH_OFFICE.find((r) => r.value === role)?.label ?? role

  useEffect(() => {
    const title = selectedMember
      ? `Remoción: ${selectedMember.full_name || selectedMember.email || selectedMember.id} (${roleLabel})`
      : initialData?.title ?? 'Remoción: '
    const description = [
      selectedMember &&
        `Miembro: ${selectedMember.full_name || selectedMember.email || selectedMember.id}`,
      `Cargo del que se remueve: ${roleLabel}`,
      justificacion && `Justificación:\n${justificacion}`,
    ]
      .filter(Boolean)
      .join('\n\n')
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction: {
        type: 'removal',
        member_id: memberId || undefined,
        role: role || undefined,
      },
    })
  }, [memberId, role, justificacion, selectedMember, roleLabel, onFieldsChange, initialData?.title])

  return (
    <div className="space-y-4">
      <div>
        <Label>Miembro a remover del cargo</Label>
        <Select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-1 w-full"
        >
          <option value="">Selecciona un miembro con cargo</option>
          {membersWithOffice.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name || m.email || m.id} — {ROLES_WITH_OFFICE.find((r) => r.value === m.role)?.label ?? m.role}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Cargo del que se remueve</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full">
          {ROLES_WITH_OFFICE.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Justificación</Label>
        <Textarea
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder="Motivos de la propuesta de remoción..."
          rows={4}
          className="mt-1"
        />
      </div>
    </div>
  )
}
