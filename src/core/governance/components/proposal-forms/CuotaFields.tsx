import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { SearchableSelect } from './SearchableSelect'
import { useI18n } from '@/shared/hooks/useI18n'

export function CuotaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const APLICA_A_OPTIONS = [
    { value: 'ordinaria', label: t('cuotaFields.type.ordinary') },
    { value: 'extraordinaria', label: t('cuotaFields.type.extraordinary') },
  ]
  const { communityId } = useCommunityContext()
  const [montoActual, setMontoActual] = useState(
    (initialData?.metadata?.montoActual as string) ?? ''
  )
  const [nuevoMonto, setNuevoMonto] = useState(
    String((initialData?.financialInstruction?.new_amount ?? '') || '')
  )
  const [fechaVigor, setFechaVigor] = useState(
    (initialData?.financialInstruction?.effective_date as string) ?? ''
  )
  const [aplicaA, setAplicaA] = useState<'ordinaria' | 'extraordinaria'>(
    (initialData?.metadata?.aplicaA as 'ordinaria' | 'extraordinaria') ?? 'ordinaria'
  )

  const { data: activeMembers } = useQuery({
    queryKey: ['active-members-count', communityId],
    queryFn: async () => {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId!)
        .eq('status', 'active')
      return count ?? 0
    },
    enabled: !!communityId,
    staleTime: 60_000,
  })

  const newAmountNum = nuevoMonto !== '' ? Number(nuevoMonto) : NaN
  const impacto = activeMembers != null && !Number.isNaN(newAmountNum) && newAmountNum >= 0
    ? newAmountNum * activeMembers
    : null

  useEffect(() => {
    const appliesLabel = aplicaA === 'ordinaria' ? t('cuotaFields.type.ordinary') : t('cuotaFields.type.extraordinary')
    const title = nuevoMonto && aplicaA
      ? `${t('cuotaFields.titlePrefix')} ${appliesLabel}: ${rules.treasury.currency} ${nuevoMonto}`
      : initialData?.title ?? ''
    const description = [
      montoActual && t('cuotaFields.desc.current').replace('{currency}', rules.treasury.currency).replace('{value}', montoActual),
      t('cuotaFields.desc.new').replace('{currency}', rules.treasury.currency).replace('{value}', nuevoMonto || t('cuotaFields.desc.indicate')),
      fechaVigor && t('cuotaFields.desc.effective').replace('{value}', fechaVigor),
      aplicaA && t('cuotaFields.desc.applies').replace('{value}', appliesLabel),
      impacto != null && t('cuotaFields.desc.impact')
        .replace('{count}', String(activeMembers))
        .replace('{currency}', rules.treasury.currency)
        .replace('{value}', impacto.toLocaleString()),
    ]
      .filter(Boolean)
      .join('\n')
    const financialInstruction =
      nuevoMonto !== '' && Number(nuevoMonto) >= 0
        ? {
            type: 'quota_change' as const,
            new_amount: Number(nuevoMonto),
            effective_date: fechaVigor || undefined,
          }
        : undefined
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        montoActual: montoActual || undefined,
        aplicaA,
      },
    })
  }, [montoActual, nuevoMonto, fechaVigor, aplicaA, impacto, activeMembers, rules.treasury.currency, onFieldsChange, initialData, t])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('cuotaFields.currentAmountLabel')} ({rules.treasury.currency})</Label>
        <Input
          value={montoActual}
          onChange={(e) => setMontoActual(e.target.value)}
          placeholder={t('cuotaFields.currentAmountPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('cuotaFields.newAmountLabel')} ({rules.treasury.currency})</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={nuevoMonto}
          onChange={(e) => setNuevoMonto(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('cuotaFields.effectiveDateLabel')}</Label>
        <Input
          type="date"
          value={fechaVigor}
          onChange={(e) => setFechaVigor(e.target.value)}
        />
      </div>
      <SearchableSelect
        label={t('cuotaFields.appliesToLabel')}
        value={aplicaA}
        onChange={(v) => setAplicaA(v as 'ordinaria' | 'extraordinaria')}
        options={APLICA_A_OPTIONS}
        placeholder={t('cuotaFields.appliesToPlaceholder')}
      />
      {impacto != null && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium text-muted-foreground">{t('cuotaFields.impactTitle')}</p>
          <p className="text-lg font-semibold">
            {activeMembers} {t('assemblyDetail.memberFallback').toLowerCase()}s × {rules.treasury.currency} {Number(nuevoMonto).toLocaleString()} = {rules.treasury.currency} {impacto.toLocaleString()} / {t('cuotaFields.impactPeriod')}
          </p>
        </div>
      )}
    </div>
  )
}
