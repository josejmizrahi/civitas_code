import { useState, useEffect, useMemo } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { SearchableSelect } from './SearchableSelect'
import { Select } from '@/shared/components/ui/select'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

export function EleccionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const { data: members } = useMembers()
  const CARGOS = useMemo(() => [
    { value: 'admin', label: t('eleccionFields.role.admin') },
    { value: 'comite_vigilancia', label: t('eleccionFields.role.vigilance') },
    { value: 'tesorero', label: t('eleccionFields.role.treasurer') },
  ], [t])
  const [cargo, setCargo] = useState(
    (initialData?.metadata?.cargo as string) ?? 'admin'
  )
  const [candidatos, setCandidatos] = useState<string[]>(
    (initialData?.metadata?.candidatos as string[]) ?? ['']
  )
  const [periodo, setPeriodo] = useState(
    (initialData?.metadata?.periodo as string) ?? ''
  )
  const [vacantes, setVacantes] = useState(
    Number((initialData?.metadata?.vacantes as number) ?? 1) || 1
  )
  const [avisoMorosos, setAvisoMorosos] = useState(
    (initialData?.metadata?.avisoMorosos as boolean) ?? true
  )

  const memberOptions = useMemo(
    () => (members ?? [])
      .filter((m) => m.status === 'active')
      .map((m) => ({
        id: m.id,
        label: m.full_name || m.email || m.id,
      })),
    [members],
  )

  const [candidateMemberIds, setCandidateMemberIds] = useState<string[]>(
    (initialData?.metadata?.candidate_member_ids as string[]) ?? []
  )

  useEffect(() => {
    if (cargo !== 'comite_vigilancia' && vacantes !== 1) {
      setVacantes(1)
    }
  }, [cargo, vacantes])

  const addCandidato = () => {
    setCandidatos((prev) => [...prev, ''])
    setCandidateMemberIds((prev) => [...prev, ''])
  }
  const removeCandidato = (i: number) => {
    setCandidatos((prev) => prev.filter((_, idx) => idx !== i))
    setCandidateMemberIds((prev) => prev.filter((_, idx) => idx !== i))
  }
  const setCandidatoAt = (i: number, value: string) =>
    setCandidatos((prev) => {
      const next = [...prev]
      next[i] = value
      return next
    })
  const setCandidateMemberAt = (i: number, memberId: string) =>
    setCandidateMemberIds((prev) => {
      const next = [...prev]
      next[i] = memberId
      return next
    })

  useEffect(() => {
    const cargoLabel = CARGOS.find((c) => c.value === cargo)?.label ?? cargo
    const title = cargoLabel ? `${t('eleccionFields.titlePrefix')}: ${cargoLabel}` : (initialData?.title ?? '')
    const list = candidatos.filter(Boolean)
    const normalizedCandidateMemberIds = list.map((_, idx) => candidateMemberIds[idx] ?? '')
    const description = [
      t('eleccionFields.desc.role').replace('{value}', cargoLabel),
      `Cargo ID: ${cargo}`,
      `Vacantes: ${vacantes}`,
      periodo && t('eleccionFields.desc.period').replace('{value}', periodo),
      list.length > 0 && t('eleccionFields.desc.candidates').replace('{value}', list.join(', ')),
      avisoMorosos && t('eleccionFields.desc.warning'),
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
        candidate_member_ids: normalizedCandidateMemberIds,
        periodo: periodo || undefined,
        vacantes,
        avisoMorosos,
      },
    })
  }, [cargo, candidatos, candidateMemberIds, periodo, vacantes, avisoMorosos, onFieldsChange, initialData, t, CARGOS])

  return (
    <div className="space-y-4">
      <SearchableSelect
        label={t('eleccionFields.roleLabel')}
        value={cargo}
        onChange={setCargo}
        options={CARGOS}
        placeholder={t('eleccionFields.rolePlaceholder')}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('eleccionFields.candidatesLabel')}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCandidato} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t('eleccionFields.add')}
          </Button>
        </div>
        <div className="space-y-2">
          {candidatos.map((name, i) => (
            <div key={i} className="space-y-2 rounded-md border p-2">
              <div className="flex gap-2">
                <Select
                  value={candidateMemberIds[i] ?? ''}
                  onChange={(e) => {
                    const memberId = e.target.value
                    setCandidateMemberAt(i, memberId)
                    const selected = memberOptions.find((m) => m.id === memberId)
                    if (selected) setCandidatoAt(i, selected.label)
                  }}
                >
                  <option value="">Seleccionar miembro (opcional)</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCandidato(i)}
                  disabled={candidatos.length <= 1}
                  aria-label={t('eleccionFields.removeCandidate')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={name}
                onChange={(e) => setCandidatoAt(i, e.target.value)}
                placeholder={t('eleccionFields.candidatePlaceholder').replace('{index}', String(i + 1))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 text-xs text-muted-foreground"
                onClick={() => setCandidateMemberAt(i, '')}
              >
                Limpiar vinculación de miembro
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('eleccionFields.periodLabel')}</Label>
        <Input
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder={t('eleccionFields.periodPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>Vacantes del cargo</Label>
        <Input
          type="number"
          min={1}
          max={cargo === 'comite_vigilancia' ? 10 : 1}
          value={vacantes}
          onChange={(e) => {
            const n = Number(e.target.value || '1')
            if (Number.isNaN(n)) return
            if (cargo === 'comite_vigilancia') setVacantes(Math.min(Math.max(1, n), 10))
            else setVacantes(1)
          }}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={avisoMorosos}
          onChange={(e) => setAvisoMorosos(e.target.checked)}
          className="rounded border-input"
        />
        <span className="text-sm">{t('eleccionFields.includeWarning')}</span>
      </label>
    </div>
  )
}
