import { useState } from 'react'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../hooks/useBudgets'
import { useTransactions } from '../hooks/useTransactions'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { getCategories } from '../services/treasury.service'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/lib/utils'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import type { Budget } from '../types'
import type { FundType } from '@/shared/types/rules'

export function BudgetOverview({ fundType }: { fundType?: FundType } = {}) {
  const { communityId } = useCommunityContext()
  const { canManageTreasury } = usePermissions()
  const { data: budgets, isLoading } = useBudgets(fundType)
  const { data: transactions } = useTransactions(fundType ? { fundType } : undefined)
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()
  const toast = useToast()

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const [showCreate, setShowCreate] = useState(false)
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newPeriod, setNewPeriod] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [createError, setCreateError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ amount: number; period: string }>({ amount: 0, period: '' })

  // Calculate actual spending per category
  const spendingByCategory = new Map<string, number>()
  transactions?.forEach((tx) => {
    if (tx.type === 'expense' && tx.category_id) {
      const current = spendingByCategory.get(tx.category_id) ?? 0
      spendingByCategory.set(tx.category_id, current + Number(tx.amount))
    }
  })

  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []

  const resetCreate = () => {
    setNewCategoryId('')
    setNewPeriod('')
    setNewAmount('')
    setCreateError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!newCategoryId || !newPeriod || !newAmount) {
      setCreateError('Todos los campos son obligatorios')
      return
    }
    try {
      await createBudget.mutateAsync({
        category_id: newCategoryId,
        period: newPeriod,
        amount: parseFloat(newAmount),
      })
      resetCreate()
      setShowCreate(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear presupuesto')
    }
  }

  const startEdit = (budget: Budget) => {
    setEditingId(budget.id)
    setEditValues({ amount: budget.amount, period: budget.period })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({ amount: 0, period: '' })
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateBudget.mutateAsync({ id: editingId, updates: editValues })
      setEditingId(null)
    } catch {
      toast.error('Error al actualizar presupuesto')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Estas seguro de eliminar este presupuesto?')) {
      deleteBudget.mutate(id, {
        onSuccess: () => toast.success('Presupuesto eliminado'),
        onError: () => toast.error('Error al eliminar presupuesto'),
      })
    }
  }

  if (isLoading) return <LoadingSpinner message="Cargando presupuestos..." className="py-8" />

  return (
    <div className="space-y-4">
      {canManageTreasury && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto
          </Button>
        </div>
      )}

      {!budgets || budgets.length === 0 ? (
        <p className="text-muted-foreground">No hay presupuestos definidos.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Periodo</TableHead>
                <TableHead className="text-right">Presupuesto</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Diferencia</TableHead>
                {canManageTreasury && <TableHead className="w-24">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const actual = spendingByCategory.get(budget.category_id) ?? 0
                const diff = budget.amount - actual
                const isEditing = editingId === budget.id

                if (isEditing) {
                  return (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.category_name || '\u2014'}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Input
                          value={editValues.period}
                          onChange={(e) => setEditValues({ ...editValues, period: e.target.value })}
                          className="w-32"
                          placeholder="2025-01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                          className="w-32 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(actual)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-muted-foreground">{'\u2014'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateBudget.isPending} aria-label="Guardar">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Cancelar">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category_name || '\u2014'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{budget.period}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(budget.amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(actual)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      <Badge variant={diff >= 0 ? 'success' : 'destructive'}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </Badge>
                    </TableCell>
                    {canManageTreasury && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(budget)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(budget.id)} disabled={deleteBudget.isPending} aria-label="Eliminar">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              {createError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{createError}</div>
              )}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
                  <option value="">Seleccionar categoria...</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Input
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  placeholder="2025-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetCreate(); setShowCreate(false) }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createBudget.isPending}>
                {createBudget.isPending ? 'Creando...' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
