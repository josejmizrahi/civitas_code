import { useState } from 'react'
import { useMarkObligationAsPaid } from '../hooks/usePaymentStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { formatCurrency } from '@/shared/lib/utils'
import type { PaymentObligation } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  obligation: PaymentObligation | null
}

export function RegisterPaymentDialog({ open, onOpenChange, obligation }: Props) {
  const markPaid = useMarkObligationAsPaid()

  const [method, setMethod] = useState<'spei' | 'efectivo' | 'transferencia' | 'otro'>('transferencia')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setMethod('transferencia')
    setReference('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obligation) return
    setError('')

    try {
      await markPaid.mutateAsync({
        obligation,
        method,
        reference: reference || undefined,
        date,
        notes: notes || undefined,
      })
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago')
    }
  }

  if (!obligation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="text-sm text-muted-foreground">Concepto</div>
              <div className="font-medium">{obligation.concept}</div>
              <div className="text-lg font-bold">{formatCurrency(obligation.amount)}</div>
            </div>

            <div className="space-y-2">
              <Label>Metodo de Pago</Label>
              <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                <option value="spei">SPEI</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referencia / Folio (opcional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej: SPEI-123456, recibo #42"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre el pago"
                rows={2}
              />
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Al registrar el pago se creara automaticamente una transaccion de ingreso vinculada a esta obligacion.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={markPaid.isPending}>
              {markPaid.isPending ? 'Registrando...' : 'Confirmar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
