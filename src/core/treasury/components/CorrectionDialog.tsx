import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useCreateCorrectionTransaction } from '../hooks/useTransactions'
import type { Transaction } from '../types'

interface CorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
}

export function CorrectionDialog({ open, onOpenChange, transaction }: CorrectionDialogProps) {
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState(String(Math.abs(transaction.amount)))
  const [description, setDescription] = useState(`Corrección: ${transaction.description || 'ajuste'}`)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const createCorrection = useCreateCorrectionTransaction()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!note.trim() || !Number.isFinite(numAmount) || numAmount <= 0) return
    createCorrection.mutate(
      {
        originalTransactionId: transaction.id,
        type: transaction.type,
        amount: numAmount,
        description: description.trim() || note,
        date,
        category_id: transaction.category_id ?? undefined,
        correction_note: note.trim(),
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setNote('')
          setAmount(String(Math.abs(transaction.amount)))
          setDescription(`Corrección: ${transaction.description || 'ajuste'}`)
          setDate(new Date().toISOString().split('T')[0])
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar corrección</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Transacción original: {transaction.description || 'Sin descripción'} — {transaction.type === 'income' ? '+' : '-'}
          {transaction.amount.toLocaleString('es-MX')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="correction_note">Motivo de la corrección (obligatorio)</Label>
            <Textarea
              id="correction_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Monto erróneo por error de captura"
              rows={2}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="correction_amount">Monto de la corrección</Label>
            <Input
              id="correction_amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use el mismo tipo (ingreso/egreso) que la original. Un ingreso de corrección suma; un egreso de corrección resta del saldo.
            </p>
          </div>
          <div>
            <Label htmlFor="correction_description">Descripción</Label>
            <Input
              id="correction_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="correction_date">Fecha</Label>
            <Input
              id="correction_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCorrection.isPending || !note.trim()}>
              {createCorrection.isPending ? 'Guardando...' : 'Registrar corrección'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
