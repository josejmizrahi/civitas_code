import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '@/core/treasury/services/treasury.service'
import type { TemplateFieldsProps } from './types'
import { CategoryPicker, type CategoryPickerValue } from './CategoryPicker'
import { SearchableSelect } from './SearchableSelect'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const PERIODO_OPTIONS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
]

const FONDO_OPTIONS = [
  { value: 'mantenimiento', label: 'Fondo de mantenimiento' },
  { value: 'reserva', label: 'Fondo de reserva' },
]

export function PresupuestoFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
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
        ? `Presupuesto ${periodo}: ${categoryName} - ${rules.treasury.currency} ${monto}`
        : initialData?.title ?? ''
    const description = [
      categoryName && `Categoría: ${categoryName}`,
      monto && `Monto solicitado: ${rules.treasury.currency} ${monto}`,
      `Periodo: ${PERIODO_OPTIONS.find((p) => p.value === periodo)?.label ?? periodo}`,
      `Fondo: ${FONDO_OPTIONS.find((f) => f.value === fondo)?.label ?? fondo}`,
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
  }, [categoryId, categoryName, monto, periodo, fondo, categories, rules.treasury.currency, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <CategoryPicker
        value={category}
        onChange={setCategory}
        label="Categoría"
        placeholder="Buscar categoría..."
      />
      <div className="space-y-2">
        <Label>Monto solicitado ({rules.treasury.currency})</Label>
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
        label="Periodo"
        value={periodo}
        onChange={setPeriodo}
        options={PERIODO_OPTIONS}
        placeholder="Buscar periodo..."
      />
      <SearchableSelect
        label="Fondo"
        value={fondo}
        onChange={(v) => setFondo(v as 'mantenimiento' | 'reserva')}
        options={FONDO_OPTIONS}
        placeholder="Buscar fondo..."
      />
    </div>
  )
}
