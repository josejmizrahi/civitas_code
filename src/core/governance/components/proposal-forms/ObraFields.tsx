import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { EntityPicker, type EntityPickerValue } from './EntityPicker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

export interface CronogramaRow {
  fase: string
  monto: string
  fecha: string
}

const COTIZACIONES_MIN = 3

export function ObraFields({ rules, onFieldsChange, initialData }: TemplateFieldsProps) {
  const [contratista, setContratista] = useState<EntityPickerValue>({
    entityId: (initialData?.metadata?.contratistaId as string) ?? null,
    recipientName: (initialData?.metadata?.contratistaName as string) ?? '',
  })
  const [montoTotal, setMontoTotal] = useState(
    String((initialData?.financialInstruction?.amount ?? '') || (initialData?.metadata?.montoTotal ?? ''))
  )
  const [cronograma, setCronograma] = useState<CronogramaRow[]>(() => {
    const prev = (initialData?.metadata?.cronograma as CronogramaRow[]) ?? []
    return prev.length > 0 ? prev : [{ fase: '', monto: '', fecha: '' }]
  })
  const [cotizaciones, setCotizaciones] = useState<string>(
    (initialData?.metadata?.cotizaciones as string) ?? ''
  )
  const [duracion, setDuracion] = useState(
    (initialData?.metadata?.duracion as string) ?? ''
  )

  const addCronogramaRow = () =>
    setCronograma((prev) => [...prev, { fase: '', monto: '', fecha: '' }])
  const removeCronogramaRow = (i: number) =>
    setCronograma((prev) => prev.filter((_, idx) => idx !== i))
  const setCronogramaRow = (i: number, field: keyof CronogramaRow, value: string) =>
    setCronograma((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })

  const cotizacionesCount = cotizaciones.trim() ? cotizaciones.split(/[\n,]/).filter(Boolean).length : 0
  const cotizacionesOk = cotizacionesCount >= COTIZACIONES_MIN

  useEffect(() => {
    const title =
      contratista.recipientName && montoTotal
        ? `Obra: ${contratista.recipientName} - ${rules.treasury.currency} ${montoTotal}`
        : initialData?.title ?? ''
    const cronogramaText = cronograma
      .filter((r) => r.fase || r.monto || r.fecha)
      .map((r) => `${r.fase || '—'}: ${rules.treasury.currency} ${r.monto || '—'} (${r.fecha || '—'})`)
      .join('\n')
    const description = [
      contratista.recipientName && `Contratista: ${contratista.recipientName}`,
      montoTotal && `Monto total: ${rules.treasury.currency} ${montoTotal}`,
      duracion && `Duración estimada: ${duracion}`,
      cronogramaText && `Cronograma de pagos:\n${cronogramaText}`,
      cotizaciones && `Cotizaciones (mín. ${COTIZACIONES_MIN}):\n${cotizaciones}`,
    ]
      .filter(Boolean)
      .join('\n\n')
    const financialInstruction =
      montoTotal !== '' && Number(montoTotal) >= 0 && contratista.recipientName
        ? {
            type: 'disbursement' as const,
            amount: Number(montoTotal),
            recipient_name: contratista.recipientName,
            description: `Obra - ${duracion || 'Ver cronograma'}`,
          }
        : undefined
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      financialInstruction,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        contratistaId: contratista.entityId ?? undefined,
        contratistaName: contratista.recipientName || undefined,
        montoTotal: montoTotal || undefined,
        cronograma,
        cotizaciones: cotizaciones || undefined,
        duracion: duracion || undefined,
      },
    })
  }, [contratista, montoTotal, cronograma, cotizaciones, duracion, rules.treasury.currency, onFieldsChange, initialData])

  return (
    <div className="space-y-4">
      <EntityPicker
        value={contratista}
        onChange={setContratista}
        label="Contratista"
        placeholder="Buscar contratista..."
      />
      <div className="space-y-2">
        <Label>Monto total ({rules.treasury.currency})</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={montoTotal}
          onChange={(e) => setMontoTotal(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>Duración estimada</Label>
        <Input
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          placeholder="Ej: 3 meses, 90 días"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Cronograma de pagos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCronogramaRow} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Fase
          </Button>
        </div>
        <div className="space-y-2 rounded-md border p-3">
          {cronograma.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
              <Input
                value={row.fase}
                onChange={(e) => setCronogramaRow(i, 'fase', e.target.value)}
                placeholder="Fase / concepto"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={row.monto}
                onChange={(e) => setCronogramaRow(i, 'monto', e.target.value)}
                placeholder="Monto"
              />
              <Input
                type="date"
                value={row.fecha}
                onChange={(e) => setCronogramaRow(i, 'fecha', e.target.value)}
                placeholder="Fecha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCronogramaRow(i)}
                disabled={cronograma.length <= 1}
                aria-label="Quitar fila"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Cotizaciones (mínimo {COTIZACIONES_MIN})</Label>
        <Textarea
          value={cotizaciones}
          onChange={(e) => setCotizaciones(e.target.value)}
          placeholder="Una por línea o separadas por coma"
          rows={3}
        />
        {!cotizacionesOk && cotizaciones.trim() !== '' && (
          <p className="text-xs text-amber-600">
            Se recomienda al menos {COTIZACIONES_MIN} cotizaciones. Actual: {cotizacionesCount}.
          </p>
        )}
      </div>
    </div>
  )
}
