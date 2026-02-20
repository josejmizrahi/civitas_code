import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { SearchableSelect } from './SearchableSelect'
import { Plus, Trash2 } from 'lucide-react'

const CARGOS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'comite_vigilancia', label: 'Comité de vigilancia' },
  { value: 'tesorero', label: 'Tesorero' },
]

export function EleccionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const [cargo, setCargo] = useState(
    (initialData?.metadata?.cargo as string) ?? 'admin'
  )
  const [candidatos, setCandidatos] = useState<string[]>(
    (initialData?.metadata?.candidatos as string[]) ?? ['']
  )
  const [periodo, setPeriodo] = useState(
    (initialData?.metadata?.periodo as string) ?? ''
  )
  const [avisoMorosos, setAvisoMorosos] = useState(
    (initialData?.metadata?.avisoMorosos as boolean) ?? true
  )

  const addCandidato = () => setCandidatos((prev) => [...prev, ''])
  const removeCandidato = (i: number) =>
    setCandidatos((prev) => prev.filter((_, idx) => idx !== i))
  const setCandidatoAt = (i: number, value: string) =>
    setCandidatos((prev) => {
      const next = [...prev]
      next[i] = value
      return next
    })

  useEffect(() => {
    const cargoLabel = CARGOS.find((c) => c.value === cargo)?.label ?? cargo
    const title = `Elección: ${cargoLabel}` || (initialData?.title ?? '')
    const list = candidatos.filter(Boolean)
    const description = [
      `Cargo: ${cargoLabel}`,
      periodo && `Periodo: ${periodo}`,
      list.length > 0 && `Candidatos: ${list.join(', ')}`,
      avisoMorosos && 'Aviso: Los miembros morosos no son elegibles según el reglamento.',
    ]
      .filter(Boolean)
      .join('\n')
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        cargo,
        candidatos: list,
        periodo: periodo || undefined,
        avisoMorosos,
      },
    })
  }, [cargo, candidatos, periodo, avisoMorosos, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <SearchableSelect
        label="Cargo a elegir"
        value={cargo}
        onChange={setCargo}
        options={CARGOS}
        placeholder="Buscar cargo..."
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Candidatos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCandidato} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        </div>
        <div className="space-y-2">
          {candidatos.map((name, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setCandidatoAt(i, e.target.value)}
                placeholder={`Candidato ${i + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCandidato(i)}
                disabled={candidatos.length <= 1}
                aria-label="Quitar candidato"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Periodo del cargo</Label>
        <Input
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder="Ej: 2025-2026, 12 meses"
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={avisoMorosos}
          onChange={(e) => setAvisoMorosos(e.target.checked)}
          className="rounded border-input"
        />
        <span className="text-sm">Incluir aviso: morosos no elegibles</span>
      </label>
    </div>
  )
}
