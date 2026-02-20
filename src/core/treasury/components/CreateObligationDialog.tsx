import { useState } from 'react'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useCreateObligation, useCreateBulkObligations } from '../hooks/usePaymentStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateObligationDialog({ open, onOpenChange }: Props) {
  const { data: members } = useMembers()
  const createSingle = useCreateObligation()
  const createBulk = useCreateBulkObligations()

  const [memberId, setMemberId] = useState('')
  const [forAll, setForAll] = useState(false)
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const activeMembers = members?.filter((m) => m.status === 'active') ?? []

  const reset = () => {
    setMemberId('')
    setForAll(false)
    setConcept('')
    setAmount('')
    setDueDate('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!concept || !amount || !dueDate) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (!forAll && !memberId) {
      setError('Selecciona un miembro o marca "Para todos los miembros activos"')
      return
    }
    const parsedAmount = parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser mayor a cero')
      return
    }
    if (parsedAmount > 100_000_000) {
      setError('El monto excede el límite permitido')
      return
    }

    try {
      const obligation = {
        amount: parsedAmount,
        due_date: dueDate,
        concept,
      }

      if (forAll) {
        const memberIds = activeMembers.map((m) => m.id)
        if (memberIds.length === 0) {
          setError('No hay miembros activos')
          return
        }
        await createBulk.mutateAsync({ memberIds, obligation })
      } else {
        await createSingle.mutateAsync({ member_id: memberId, ...obligation })
      }

      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear obligacion')
    }
  }

  const isPending = createSingle.isPending || createBulk.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Nueva Obligacion de Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="forAll"
                checked={forAll}
                onChange={(e) => setForAll(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="forAll">Para todos los miembros activos ({activeMembers.length})</Label>
            </div>

            {!forAll && (
              <div className="space-y-2">
                <Label>Miembro</Label>
                <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">Seleccionar miembro...</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email || m.id.slice(0, 8)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Cuota de mantenimiento enero 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : forAll ? `Crear para ${activeMembers.length} miembros` : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
