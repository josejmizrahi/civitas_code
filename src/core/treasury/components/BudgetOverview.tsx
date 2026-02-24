import { useState } from 'react'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../hooks/useBudgets'
import { useTransactions } from '../hooks/useTransactions'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useI18n } from '@/shared/hooks/useI18n'
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
import { useConfirm } from '@/shared/components/ConfirmDialog'
import type { Budget } from '../types'
import type { FundType } from '@/shared/types/rules'

export function BudgetOverview({ fundType }: { fundType?: FundType } = {}) {
  const { t } = useI18n()
  const { communityId } = useCommunityContext()
  const { canManageTreasury } = usePermissions()
  const { data: budgets, isLoading } = useBudgets(fundType)
  const { data: transactions } = useTransactions(fundType ? { fundType } : undefined)
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()
  const toast = useToast()
  const confirm = useConfirm()

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
      setCreateError(t('treasury.allFieldsRequired' as any))
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
      setCreateError(err instanceof Error ? err.message : t('treasury.errorCreatingBudget' as any))
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
      toast.error(t('treasury.errorUpdatingBudget' as any))
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('treasury.deleteBudget' as any),
      description: t('treasury.confirmDeleteBudget' as any),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    })
    if (!ok) return
    deleteBudget.mutate(id, {
      onSuccess: () => toast.success(t('treasury.budgetDeleted' as any)),
      onError: () => toast.error(t('treasury.errorDeletingBudget' as any)),
    })
  }

  if (isLoading) return <LoadingSpinner message={t('treasury.loadingBudgets' as any)} className="py-8" />

  return (
    <div className="space-y-4">
      {canManageTreasury && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('treasury.newBudget' as any)}
          </Button>
        </div>
      )}

      {!budgets || budgets.length === 0 ? (
        <p className="text-muted-foreground">{t('treasury.noBudgets' as any)}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('treasury.category' as any)}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('treasury.period' as any)}</TableHead>
                <TableHead className="text-right">{t('treasury.budget' as any)}</TableHead>
                <TableHead className="text-right">{t('treasury.actual' as any)}</TableHead>
                <TableHead className="hidden sm:table-cell text-right">{t('treasury.difference' as any)}</TableHead>
                {canManageTreasury && <TableHead className="w-24">{t('entities.actions' as any)}</TableHead>}
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
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateBudget.isPending} aria-label={t('common.save')}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label={t('common.cancel')}>
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
                          <Button size="icon" variant="ghost" onClick={() => startEdit(budget)} aria-label={t('common.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(budget.id)} disabled={deleteBudget.isPending} aria-label={t('common.delete')}>
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
            <DialogTitle>{t('treasury.newBudget' as any)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              {createError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{createError}</div>
              )}
              <div className="space-y-2">
                <Label>{t('treasury.category' as any)}</Label>
                <Select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
                  <option value="">{t('treasury.selectCategory' as any)}</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('treasury.period' as any)}</Label>
                <Input
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  placeholder="2025-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('treasury.amount' as any)}</Label>
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
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createBudget.isPending}>
                {createBudget.isPending ? t('treasury.creating' as any) : t('treasury.create' as any)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
