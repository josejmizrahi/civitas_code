import { useState } from 'react'
import { useProposePaymentPlan } from '../hooks/usePaymentPlans'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { useToast } from '@/shared/components/ui/toast'
import { Calculator, CalendarDays } from 'lucide-react'

interface Props {
  memberId: string
  totalDebt: number
  onClose: () => void
}

export function ProposePaymentPlan({ memberId, totalDebt, onClose }: Props) {
  const proposePlan = useProposePaymentPlan()
  const toast = useToast()

  const [installments, setInstallments] = useState('6')
  const [frequency, setFrequency] = useState('monthly')
  const [startDate, setStartDate] = useState(
    () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')

  const numInstallments = parseInt(installments) || 6
  const installmentAmount = Math.ceil((totalDebt / numInstallments) * 100) / 100

  const freqLabels: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
  }

  const handleSubmit = () => {
    if (numInstallments < 2 || numInstallments > 36) {
      toast.error('El número de parcialidades debe ser entre 2 y 36')
      return
    }
    if (totalDebt <= 0) {
      toast.error('La deuda total debe ser mayor a cero')
      return
    }
    const today = new Date().toISOString().split('T')[0]
    if (startDate < today) {
      toast.error('La fecha de inicio no puede ser en el pasado')
      return
    }

    proposePlan.mutate(
      {
        member_id: memberId,
        total_debt: totalDebt,
        number_of_installments: numInstallments,
        frequency,
        start_date: startDate,
        notes: notes || undefined,
        proposed_by: memberId,
      },
      {
        onSuccess: () => {
          toast.success('Plan de pago propuesto exitosamente')
          onClose()
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al proponer plan'),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Proponer Plan de Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debt summary */}
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm">
          <p className="font-medium text-red-800">
            Deuda total: ${totalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Installments */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Número de parcialidades</Label>
            <Input
              type="number"
              min="2"
              max="36"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Frecuencia</Label>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Mensual</option>
              <option value="biweekly">Quincenal</option>
              <option value="weekly">Semanal</option>
            </Select>
          </div>
        </div>

        {/* Start date */}
        <div className="space-y-1">
          <Label>Fecha de inicio</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        {/* Preview */}
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
          <div className="flex items-center gap-2 text-blue-800">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">Vista previa del plan</span>
          </div>
          <p className="text-blue-700">
            {numInstallments} pagos de <strong>${installmentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>{' '}
            ({freqLabels[frequency]})
          </p>
          <p className="text-blue-700 text-xs">
            Comenzando el {new Date(startDate).toLocaleDateString('es-MX')}
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <Label>Notas (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comentarios o justificación del plan..."
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={proposePlan.isPending}>
            {proposePlan.isPending ? 'Enviando...' : 'Proponer Plan'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
