import { useState } from 'react'
import { useCreateTransaction } from '../hooks/useTransactions'
import { getCategories } from '../services/treasury.service'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseForm({ open, onOpenChange }: Props) {
  const { communityId } = useCommunityContext()
  const createTx = useCreateTransaction()
  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')

  const filteredCategories = categories?.filter((c) => c.type === type) ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a cero')
      return
    }
    if (parsedAmount > 100_000_000) {
      setError('El monto excede el límite permitido')
      return
    }

    try {
      await createTx.mutateAsync({
        type,
        amount: parsedAmount,
        category_id: categoryId || undefined,
        description,
        date,
      })
      onOpenChange(false)
      setAmount('')
      setDescription('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear transacción')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Captura Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
                <option value="expense">Egreso</option>
                <option value="income">Ingreso</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción del movimiento" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTx.isPending}>
              {createTx.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
