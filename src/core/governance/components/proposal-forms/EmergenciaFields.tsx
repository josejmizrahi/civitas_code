import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { EntityPicker, type EntityPickerValue } from './EntityPicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

export function EmergenciaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
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
      ? `${t('emergenciaFields.titlePrefix')}: ${rules.treasury.currency} ${monto}`
      : initialData?.title ?? ''
    const description = [
      t('emergenciaFields.desc.intro'),
      beneficiario.recipientName && t('emergenciaFields.desc.beneficiary').replace('{value}', beneficiario.recipientName),
      monto && t('emergenciaFields.desc.amount').replace('{currency}', rules.treasury.currency).replace('{value}', monto),
      evidencia && t('emergenciaFields.desc.evidence').replace('{value}', evidencia),
      justificacion && t('emergenciaFields.desc.justification').replace('{value}', justificacion),
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
  }, [beneficiario, monto, evidencia, justificacion, rules.treasury.currency, onFieldsChange, initialData, t])

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          {t('emergenciaFields.alert')}
        </p>
      </div>
      <EntityPicker
        value={beneficiario}
        onChange={setBeneficiario}
        label={t('emergenciaFields.beneficiaryLabel')}
        placeholder={t('emergenciaFields.beneficiaryPlaceholder')}
      />
      <div className="space-y-2">
        <Label>{t('emergenciaFields.amountLabel')} ({rules.treasury.currency})</Label>
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
        <Label>{t('emergenciaFields.evidenceLabel')}</Label>
        <Textarea
          value={evidencia}
          onChange={(e) => setEvidencia(e.target.value)}
          placeholder={t('emergenciaFields.evidencePlaceholder')}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('emergenciaFields.justificationLabel')}</Label>
        <Textarea
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder={t('emergenciaFields.justificationPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  )
}
