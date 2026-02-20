import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { EntityPicker, type EntityPickerValue } from './EntityPicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select } from '@/shared/components/ui/select'

const FONDO_OPTIONS = [
  { value: 'mantenimiento', label: 'Fondo de mantenimiento' },
  { value: 'reserva', label: 'Fondo de reserva' },
] as const

export function GastoFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const [entity, setEntity] = useState<EntityPickerValue>({
    entityId: null,
    recipientName: (initialData?.financialInstruction?.recipient_name as string) ?? '',
  })
  const [amount, setAmount] = useState(
    String((initialData?.financialInstruction?.amount ?? '') ?? '')
  )
  const [concepto, setConcepto] = useState(
    (initialData?.financialInstruction?.description as string) ?? ''
  )
  const [cotizaciones, setCotizaciones] = useState(
    (initialData?.metadata?.cotizaciones as string) ?? ''
  )
  const [fondo, setFondo] = useState<'mantenimiento' | 'reserva'>(
    (initialData?.metadata?.fondo as 'mantenimiento' | 'reserva') ?? 'mantenimiento'
  )

  useEffect(() => {
    const title =
      concepto.trim() && entity.recipientName
        ? `Gasto: ${concepto.trim()} - ${entity.recipientName}`
        : initialData?.title ?? ''
    const description = [
      concepto && `Concepto: ${concepto}`,
      cotizaciones && `Cotizaciones o referencias:\n${cotizaciones}`,
    ]
      .filter(Boolean)
      .join('\n\n') || (initialData?.description ?? '')
    const financialInstruction =
      amount !== '' && Number(amount) >= 0 && entity.recipientName
        ? {
            type: 'disbursement' as const,
            amount: Number(amount),
            recipient_name: entity.recipientName,
            description: concepto || undefined,
          }
        : undefined
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        cotizaciones: cotizaciones || undefined,
        fondo,
      },
    })
  }, [entity, amount, concepto, cotizaciones, fondo, onFieldsChange, initialData?.title, initialData?.description, initialData?.metadata])

  return (
    <div className="space-y-4">
      <EntityPicker
        value={entity}
        onChange={setEntity}
        label="Beneficiario / Proveedor"
        placeholder="Buscar proveedor o beneficiario..."
      />
      <div className="space-y-2">
        <Label>Monto ({rules.treasury.currency})</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>Concepto</Label>
        <Input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Descripción del gasto"
        />
      </div>
      <div className="space-y-2">
        <Label>Cotizaciones (URLs o referencias)</Label>
        <Textarea
          value={cotizaciones}
          onChange={(e) => setCotizaciones(e.target.value)}
          placeholder="Enlaces a cotizaciones o notas"
          rows={2}
        />
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
