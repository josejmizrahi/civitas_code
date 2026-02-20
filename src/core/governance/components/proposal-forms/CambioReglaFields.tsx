import { useState, useEffect } from 'react'
import { getRuleCatalogEntry } from '@/shared/config/rules-catalog'
import type { TemplateFieldsProps } from './types'
import { RulePicker } from './RulePicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'

export function CambioReglaFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
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
    const title = `Cambio de regla: ${rule.label}`
    const description = [
      `Propongo cambiar la regla "${rule.label}".`,
      '',
      `Valor actual: ${rule.format(rules)}`,
      `Nuevo valor propuesto: ${nuevoValor || '[completar]'}`,
      '',
      justificacion ? `Justificación: ${justificacion}` : 'Justificación: [explicar por qué es necesario el cambio]',
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
      />
      {rule && (
        <>
          <div className="space-y-2">
            <Label>Nuevo valor propuesto</Label>
            <Input
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              placeholder={`Ej: ${rule.format(rules)} → nuevo valor`}
            />
          </div>
          <div className="space-y-2">
            <Label>Justificación legal / motivo del cambio</Label>
            <Textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Explicar por qué es necesario el cambio y, si aplica, referencia normativa."
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  )
}
