import { useState, useEffect } from 'react'
import { getRuleCatalogEntry } from '@/shared/config/rules-catalog'
import type { TemplateFieldsProps } from './types'
import { RulePicker } from './RulePicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useI18n } from '@/shared/hooks/useI18n'

export function CambioReglaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    (initialData?.metadata?.ruleId as string) ?? null
  )
  const [nuevoValor, setNuevoValor] = useState(
    (initialData?.metadata?.nuevoValor as string) ?? ''
  )
  const [justificacion, setJustificacion] = useState(
    (initialData?.metadata?.justificacion as string) ?? ''
  )

  const rule = selectedRuleId ? getRuleCatalogEntry(selectedRuleId) : null

  useEffect(() => {
    if (!selectedRuleId || !rule) {
      onFieldsChange({
        title: initialData?.title ?? '',
        description: initialData?.description ?? '',
        metadata: initialData?.metadata ? { ...initialData.metadata } : undefined,
      })
      return
    }
    const title = `${t('cambioReglaFields.titlePrefix')}: ${rule.label}`
    const description = [
      t('cambioReglaFields.description.propose').replace('{label}', rule.label),
      '',
      t('cambioReglaFields.description.current').replace('{value}', rule.format(rules)),
      t('cambioReglaFields.description.new').replace('{value}', nuevoValor || t('cambioReglaFields.description.complete')),
      '',
      justificacion
        ? t('cambioReglaFields.description.justification').replace('{value}', justificacion)
        : t('cambioReglaFields.description.justificationPlaceholder'),
    ].join('\n')
    onFieldsChange({
      title,
      description,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        ruleId: selectedRuleId,
        nuevoValor: nuevoValor || undefined,
        justificacion: justificacion || undefined,
      },
    })
  }, [selectedRuleId, rule, nuevoValor, justificacion, rules, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <RulePicker
        rules={rules}
        value={selectedRuleId}
        onChange={setSelectedRuleId}
        label={t('cambioReglaFields.ruleLabel')}
        placeholder={t('cambioReglaFields.rulePlaceholder')}
      />
      {rule && (
        <>
          <div className="space-y-2">
            <Label>{t('cambioReglaFields.newValueLabel')}</Label>
            <Input
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              placeholder={t('cambioReglaFields.newValuePlaceholder').replace('{current}', rule.format(rules))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('cambioReglaFields.justificationLabel')}</Label>
            <Textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder={t('cambioReglaFields.justificationPlaceholder')}
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  )
}
