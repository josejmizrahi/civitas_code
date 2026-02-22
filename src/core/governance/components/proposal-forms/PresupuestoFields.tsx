import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '@/core/treasury/services/treasury.service'
import type { TemplateFieldsProps } from './types'
import { CategoryPicker, type CategoryPickerValue } from './CategoryPicker'
import { SearchableSelect } from './SearchableSelect'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useI18n } from '@/shared/hooks/useI18n'

export function PresupuestoFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const PERIODO_OPTIONS = useMemo(() => [
    { value: 'mensual', label: t('presupuestoFields.period.monthly') },
    { value: 'trimestral', label: t('presupuestoFields.period.quarterly') },
    { value: 'anual', label: t('presupuestoFields.period.yearly') },
  ], [t])
  const FONDO_OPTIONS = useMemo(() => [
    { value: 'mantenimiento', label: t('presupuestoFields.fund.maintenance') },
    { value: 'reserva', label: t('presupuestoFields.fund.reserve') },
  ], [t])
  const { communityId } = useCommunityContext()
  const [category, setCategory] = useState<CategoryPickerValue>(() => {
    const id = (initialData?.financialInstruction?.category_id as string) ?? ''
    return { categoryId: id || null, categoryName: '' }
  })
  const [monto, setMonto] = useState(
    String((initialData?.financialInstruction?.amount ?? '') || '')
  )
  const [periodo, setPeriodo] = useState(
    (initialData?.financialInstruction?.period as string) ?? 'anual'
  )
  const [fondo, setFondo] = useState<'mantenimiento' | 'reserva'>(
    (initialData?.metadata?.fondo as 'mantenimiento' | 'reserva') ?? 'mantenimiento'
  )

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const categoryId = category.categoryId ?? ''
  const categoryName = category.categoryName || (categories?.find((c) => c.id === categoryId)?.name ?? '')

  useEffect(() => {
    const title =
      categoryName && monto
        ? `${t('presupuestoFields.titlePrefix')} ${periodo}: ${categoryName} - ${rules.treasury.currency} ${monto}`
        : initialData?.title ?? ''
    const periodLabel = PERIODO_OPTIONS.find((p) => p.value === periodo)?.label ?? periodo
    const fundLabel = FONDO_OPTIONS.find((f) => f.value === fondo)?.label ?? fondo
    const description = [
      categoryName && t('presupuestoFields.desc.category').replace('{value}', categoryName),
      monto && t('presupuestoFields.desc.amount').replace('{currency}', rules.treasury.currency).replace('{value}', monto),
      t('presupuestoFields.desc.period').replace('{value}', periodLabel),
      t('presupuestoFields.desc.fund').replace('{value}', fundLabel),
    ]
      .filter(Boolean)
      .join('\n')
    const financialInstruction =
      categoryId && monto !== '' && Number(monto) >= 0
        ? {
            type: 'budget_allocation' as const,
            amount: Number(monto),
            category_id: categoryId,
            period: periodo,
          }
        : undefined
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        fondo,
      },
    })
  }, [categoryId, categoryName, monto, periodo, fondo, categories, rules.treasury.currency, onFieldsChange, initialData, t, PERIODO_OPTIONS, FONDO_OPTIONS])

  return (
    <div className="space-y-4">
      <CategoryPicker
        value={category}
        onChange={setCategory}
        label={t('presupuestoFields.categoryLabel')}
        placeholder={t('presupuestoFields.categoryPlaceholder')}
      />
      <div className="space-y-2">
        <Label>{t('presupuestoFields.amountLabel')} ({rules.treasury.currency})</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <SearchableSelect
        label={t('presupuestoFields.periodLabel')}
        value={periodo}
        onChange={setPeriodo}
        options={PERIODO_OPTIONS}
        placeholder={t('presupuestoFields.periodPlaceholder')}
      />
      <SearchableSelect
        label={t('presupuestoFields.fundLabel')}
        value={fondo}
        onChange={(v) => setFondo(v as 'mantenimiento' | 'reserva')}
        options={FONDO_OPTIONS}
        placeholder={t('presupuestoFields.fundPlaceholder')}
      />
    </div>
  )
}
