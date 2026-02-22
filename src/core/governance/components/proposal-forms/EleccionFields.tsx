import { useState, useEffect, useMemo } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { SearchableSelect } from './SearchableSelect'
import { Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

export function EleccionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
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
    const title = cargoLabel ? `${t('eleccionFields.titlePrefix')}: ${cargoLabel}` : (initialData?.title ?? '')
    const list = candidatos.filter(Boolean)
    const description = [
      t('eleccionFields.desc.role').replace('{value}', cargoLabel),
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
        periodo: periodo || undefined,
        avisoMorosos,
      },
    })
  }, [cargo, candidatos, periodo, avisoMorosos, onFieldsChange, initialData, t, CARGOS])

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
            <div key={i} className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setCandidatoAt(i, e.target.value)}
                  placeholder={t('eleccionFields.candidatePlaceholder').replace('{index}', String(i + 1))}
              />
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
