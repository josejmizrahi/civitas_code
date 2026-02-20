import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

const APLICA_A_OPTIONS = [
  { value: 'ordinaria', label: 'Cuota ordinaria' },
  { value: 'extraordinaria', label: 'Cuota extraordinaria' },
] as const

export function CuotaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
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
    const title = nuevoMonto && aplicaA
      ? `Cambio de cuota ${aplicaA}: ${rules.treasury.currency} ${nuevoMonto}`
      : initialData?.title ?? ''
    const description = [
      montoActual && `Monto actual (referencia): ${rules.treasury.currency} ${montoActual}`,
      `Nuevo monto propuesto: ${rules.treasury.currency} ${nuevoMonto || '[indicar]'}`,
      fechaVigor && `Entrada en vigor: ${fechaVigor}`,
      aplicaA && `Aplica a: ${aplicaA === 'ordinaria' ? 'Cuota ordinaria' : 'Cuota extraordinaria'}`,
      impacto != null && `Impacto estimado (${activeMembers} miembros): ${rules.treasury.currency} ${impacto.toLocaleString()} mensual`,
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
  }, [montoActual, nuevoMonto, fechaVigor, aplicaA, impacto, activeMembers, rules.treasury.currency, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Monto actual (referencia) ({rules.treasury.currency})</Label>
        <Input
          value={montoActual}
          onChange={(e) => setMontoActual(e.target.value)}
          placeholder="Opcional — monto vigente para referencia"
        />
      </div>
      <div className="space-y-2">
        <Label>Nuevo monto ({rules.treasury.currency})</Label>
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
        <Label>Fecha de entrada en vigor</Label>
        <Input
          type="date"
          value={fechaVigor}
          onChange={(e) => setFechaVigor(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Aplica a</Label>
        <Select
          value={aplicaA}
          onChange={(e) => setAplicaA(e.target.value as 'ordinaria' | 'extraordinaria')}
        >
          {APLICA_A_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      {impacto != null && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium text-muted-foreground">Impacto estimado</p>
          <p className="text-lg font-semibold">
            {activeMembers} miembros × {rules.treasury.currency} {Number(nuevoMonto).toLocaleString()} = {rules.treasury.currency} {impacto.toLocaleString()} / periodo
          </p>
        </div>
      )}
    </div>
  )
}
