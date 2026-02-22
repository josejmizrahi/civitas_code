import { useState } from 'react'
import { useTenant } from '@/shared/hooks/useTenant'
import { useSetVigilanceFlag } from '../hooks/useTransactions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { Transaction } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
}

export function FlagVigilanceDialog({ open, onOpenChange, transaction }: Props) {
  const { membership } = useTenant()
  const memberId = membership?.id ?? null
  const setFlag = useSetVigilanceFlag()
  const [note, setNote] = useState(transaction.vigilance_note ?? '')

  const handleSubmit = () => {
    if (!memberId) return
    setFlag.mutate(
      { transactionId: transaction.id, flag: true, note: note || undefined, memberId },
      {
        onSuccess: () => {
          onOpenChange(false)
          setNote('')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar para vigilancia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta transacción quedará visible en la pestaña &quot;Marcadas&quot; del Comité de Vigilancia.
          </p>
          <div>
            <Label className="text-sm">Observación (opcional)</Label>
            <Input
              className="mt-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Revisar con tesorería"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={setFlag.isPending}>Marcar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
