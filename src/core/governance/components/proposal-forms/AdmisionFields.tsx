import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const DOCS_CHECKLIST = [
  { id: 'identificacion', label: 'Identificación oficial' },
  { id: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
  { id: 'solicitud_firmada', label: 'Solicitud de admisión firmada' },
  { id: 'otros', label: 'Otros documentos' },
] as const

export function AdmisionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const [candidato, setCandidato] = useState(
    (initialData?.metadata?.candidato as string) ?? ''
  )
  const [email, setEmail] = useState(
    (initialData?.metadata?.email as string) ?? ''
  )
  const [unidad, setUnidad] = useState(
    (initialData?.metadata?.unidad as string) ?? ''
  )
  const [docsPresentados, setDocsPresentados] = useState<Record<string, boolean>>(() => {
    const prev = (initialData?.metadata?.docsPresentados as Record<string, boolean>) ?? {}
    return DOCS_CHECKLIST.reduce((acc, { id }) => ({ ...acc, [id]: prev[id] ?? false }), {} as Record<string, boolean>)
  })

  useEffect(() => {
    const title = candidato ? `Admisión: ${candidato}` : initialData?.title ?? ''
    const description = [
      candidato && `Candidato: ${candidato}`,
      email && `Email (invitación): ${email}`,
      unidad && `Unidad / Departamento: ${unidad}`,
      'Documentación presentada:',
      ...DOCS_CHECKLIST.map((d) => `- ${d.label}: ${docsPresentados[d.id] ? 'Sí' : 'No'}`),
    ]
      .filter(Boolean)
      .join('\n')
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        candidato: candidato || undefined,
        email: email || undefined,
        unidad: unidad || undefined,
        docsPresentados,
      },
    })
  }, [candidato, email, unidad, docsPresentados, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre del candidato</Label>
        <Input
          value={candidato}
          onChange={(e) => setCandidato(e.target.value)}
          placeholder="Nombre completo"
        />
      </div>
      <div className="space-y-2">
        <Label>Email (para invitación)</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Unidad / Departamento</Label>
        <Input
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <Label>Documentación presentada</Label>
        <div className="space-y-2 rounded-md border p-3">
          {DOCS_CHECKLIST.map((d) => (
            <label key={d.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={docsPresentados[d.id] ?? false}
                onChange={(e) =>
                  setDocsPresentados((prev) => ({ ...prev, [d.id]: e.target.checked }))
                }
                className="rounded border-input"
              />
              <span className="text-sm">{d.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
