import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { EntityPicker, type EntityPickerValue } from './EntityPicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { SearchableSelect } from './SearchableSelect'
import { useI18n } from '@/shared/hooks/useI18n'

export function GastoFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const FONDO_OPTIONS = [
    { value: 'mantenimiento', label: t('gastoFields.fund.maintenance') },
    { value: 'reserva', label: t('gastoFields.fund.reserve') },
  ]
  const [entity, setEntity] = useState<EntityPickerValue>({
    entityId: null,
    recipientName: (initialData?.financialInstruction?.recipient_name as string) ?? '',
  })
  const [amount, setAmount] = useState(
    String(initialData?.financialInstruction?.amount ?? '')
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
        ? `${t('gastoFields.title')}: ${concepto.trim()} - ${entity.recipientName}`
        : initialData?.title ?? ''
    const description = [
      concepto && t('gastoFields.desc.concept').replace('{value}', concepto),
      cotizaciones && t('gastoFields.desc.quotes').replace('{value}', cotizaciones),
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
        label={t('gastoFields.entityLabel')}
        placeholder={t('gastoFields.entityPlaceholder')}
      />
      <div className="space-y-2">
        <Label>{t('gastoFields.amountLabel')} ({rules.treasury.currency})</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('gastoFields.amountPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('gastoFields.conceptLabel')}</Label>
        <Input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder={t('gastoFields.conceptPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('gastoFields.quotesLabel')}</Label>
        <Textarea
          value={cotizaciones}
          onChange={(e) => setCotizaciones(e.target.value)}
          placeholder={t('gastoFields.quotesPlaceholder')}
          rows={2}
        />
      </div>
      <SearchableSelect
        label={t('gastoFields.fundLabel')}
        value={fondo}
        onChange={(v) => setFondo(v as 'mantenimiento' | 'reserva')}
        options={FONDO_OPTIONS}
        placeholder={t('presupuestoFields.fundPlaceholder')}
      />
    </div>
  )
}
