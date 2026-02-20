import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '@/core/treasury/services/treasury.service'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

const PERIODO_OPTIONS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
] as const

const FONDO_OPTIONS = [
  { value: 'mantenimiento', label: 'Fondo de mantenimiento' },
  { value: 'reserva', label: 'Fondo de reserva' },
] as const

export function PresupuestoFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { communityId } = useCommunityContext()
  const [categoryId, setCategoryId] = useState(
    (initialData?.financialInstruction?.category_id as string) ?? ''
  )
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

  useEffect(() => {
    const categoryName = categories?.find((c) => c.id === categoryId)?.name ?? ''
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
  }, [categoryId, monto, periodo, fondo, categories, rules.treasury.currency, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Seleccionar categoría</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
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
      <div className="space-y-2">
        <Label>Periodo</Label>
        <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          {PERIODO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Fondo</Label>
        <Select
          value={fondo}
          onChange={(e) => setFondo(e.target.value as 'mantenimiento' | 'reserva')}
        >
          {FONDO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
