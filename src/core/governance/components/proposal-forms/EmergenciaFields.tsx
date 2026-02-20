import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { EntityPicker, type EntityPickerValue } from './EntityPicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'

export function EmergenciaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const [beneficiario, setBeneficiario] = useState<EntityPickerValue>({
    entityId: null,
    recipientName: (initialData?.financialInstruction?.recipient_name as string) ?? '',
  })
  const [monto, setMonto] = useState(
    String((initialData?.financialInstruction?.amount ?? '') || '')
  )
  const [evidencia, setEvidencia] = useState(
    (initialData?.metadata?.evidencia as string) ?? ''
  )
  const [justificacion, setJustificacion] = useState(
    (initialData?.metadata?.justificacion as string) ?? ''
  )

  useEffect(() => {
    const title = monto
      ? `Gasto de emergencia: ${rules.treasury.currency} ${monto}`
      : initialData?.title ?? ''
    const description = [
      'Propuesta de gasto por emergencia.',
      beneficiario.recipientName && `Beneficiario: ${beneficiario.recipientName}`,
      monto && `Monto estimado: ${rules.treasury.currency} ${monto}`,
      evidencia && `Evidencia (fotos/URLs):\n${evidencia}`,
      justificacion && `Justificación de la emergencia:\n${justificacion}`,
    ]
      .filter(Boolean)
      .join('\n\n')
    const financialInstruction =
      monto !== '' && Number(monto) >= 0
        ? {
            type: 'disbursement' as const,
            amount: Number(monto),
            recipient_name: beneficiario.recipientName || undefined,
            description: justificacion || undefined,
          }
        : undefined
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        evidencia: evidencia || undefined,
        justificacion: justificacion || undefined,
      },
    })
  }, [beneficiario, monto, evidencia, justificacion, rules.treasury.currency, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Esta propuesta es para un gasto de urgencia. Incluya evidencia y justificación.
        </p>
      </div>
      <EntityPicker
        value={beneficiario}
        onChange={setBeneficiario}
        label="Beneficiario / Proveedor"
        placeholder="Buscar proveedor o beneficiario..."
      />
      <div className="space-y-2">
        <Label>Monto estimado ({rules.treasury.currency})</Label>
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
        <Label>Evidencia (fotos o URLs)</Label>
        <Textarea
          value={evidencia}
          onChange={(e) => setEvidencia(e.target.value)}
          placeholder="Enlaces a fotos, reportes o documentos que respalden la emergencia"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Justificación de la emergencia</Label>
        <Textarea
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder="Por qué se considera urgente y no puede esperar al proceso ordinario"
          rows={3}
        />
      </div>
    </div>
  )
}
