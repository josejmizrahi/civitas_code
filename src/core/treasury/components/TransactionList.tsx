import { useState, useEffect } from 'react'
import { useTransactions, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { getCategories } from '../services/treasury.service'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { formatCurrency, formatDate, downloadAsCSV, downloadAsExcel } from '@/shared/lib/utils'
import { Pencil, Trash2, Check, X, Download, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyTransaction } from '../services/receipt.service'
import type { Transaction } from '../types'
import type { FundType } from '@/shared/types/rules'
import { useI18n } from '@/shared/hooks/useI18n'

const MD_BREAKPOINT = 768
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MD_BREAKPOINT)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  return isMobile
}

export function TransactionList({ fundType }: { fundType?: FundType } = {}) {
  const { t } = useI18n()
  const [type, setType] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})
  const isMobile = useIsMobile()

  const { communityId } = useCommunityContext()
  const { canManageTreasury } = usePermissions()
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()
  const toast = useToast()
  const queryClient = useQueryClient()

  const verifyMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'disputed' }) =>
      verifyTransaction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success(t('transactions.toast.verified'))
    },
    onError: () => toast.error(t('transactions.toast.verifyError')),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const filters = {
    ...(type && { type }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(fundType && { fundType }),
  }

  const hasFilters = fundType || type || dateFrom || dateTo
  const { data: transactions, isLoading } = useTransactions(hasFilters ? filters : undefined)

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setEditValues({
      type: tx.type,
      amount: tx.amount,
      category_id: tx.category_id,
      description: tx.description,
      date: tx.date,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateTx.mutateAsync({ id: editingId, updates: editValues })
      setEditingId(null)
      setEditValues({})
    } catch {
      toast.error(t('transactions.toast.updateError'))
    }
  }

  const handleDelete = (id: string) => {
    if (confirm(t('transactions.confirmDelete'))) {
      deleteTx.mutate(id, {
        onSuccess: () => toast.success(t('transactions.toast.deleted')),
        onError: () => toast.error(t('transactions.toast.deleteError')),
      })
    }
  }

  const exportData = (transactions ?? []).map(tx => ({
    [t('transactions.table.date')]: tx.date,
    [t('transactions.table.type')]: tx.type === 'income' ? t('transactions.badge.income') : t('transactions.badge.expense'),
    [t('transactions.table.amount')]: tx.amount,
    [t('transactions.table.category')]: tx.category_name || '',
    [t('transactions.table.description')]: tx.description || '',
    Referencia: tx.external_ref || '',
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-full sm:w-40">
            <option value="">{t('transactions.filter.allTypes')}</option>
            <option value="income">{t('transactions.filter.income')}</option>
            <option value="expense">{t('transactions.filter.expense')}</option>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 sm:w-40" placeholder={t('transactions.filter.from')} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 sm:w-40" placeholder={t('transactions.filter.to')} />
          </div>
        </div>
        {(transactions?.length ?? 0) > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadAsCSV(exportData, 'transacciones')}>
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadAsExcel(exportData, 'transacciones', 'Transacciones')}>
              <Download className="mr-1 h-3 w-3" />
              Excel
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions.table.date')}</TableHead>
              <TableHead>{t('transactions.table.description')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('transactions.table.category')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('transactions.table.type')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('transactions.table.origin')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('transactions.table.verification')}</TableHead>
              <TableHead className="text-right">{t('transactions.table.amount')}</TableHead>
              {canManageTreasury && <TableHead className="w-28">{t('transactions.table.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 8 : 7} className="text-center text-muted-foreground">{t('transactions.table.loading')}</TableCell>
              </TableRow>
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 8 : 7} className="text-center text-muted-foreground">
                  {t('transactions.table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => {
                const isEditing = editingId === tx.id
                const showInlineEdit = isEditing && !isMobile

                if (showInlineEdit) {
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Input
                          type="date"
                          value={editValues.date || ''}
                          onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editValues.category_id || ''}
                          onChange={(e) => setEditValues({ ...editValues, category_id: e.target.value || null })}
                          className="w-36"
                        >
                          <option value="">{t('transactions.edit.noCategory')}</option>
                          {categories?.filter((c) => c.type === editValues.type).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editValues.type || ''}
                          onChange={(e) => setEditValues({ ...editValues, type: e.target.value as any })}
                          className="w-28"
                        >
                          <option value="income">{t('transactions.badge.income')}</option>
                          <option value="expense">{t('transactions.badge.expense')}</option>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" />
                      <TableCell className="hidden md:table-cell" />
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues.amount || ''}
                          onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateTx.isPending} aria-label={t('transactions.edit.save')}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label={t('transactions.edit.cancel')}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description || '\u2014'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {tx.category_name ? (
                        <Badge variant="secondary">{tx.category_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={tx.type === 'income' ? 'success' : 'destructive'}>
                        {tx.type === 'income' ? t('transactions.badge.income') : t('transactions.badge.expense')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">
                        {((tx as any).origin ?? 'manual') === 'rail'
                          ? t('transactions.origin.rail')
                          : ((tx as any).origin ?? 'manual') === 'import'
                            ? t('transactions.origin.import')
                            : ((tx as any).origin ?? 'manual') === 'system'
                              ? t('transactions.origin.system')
                              : t('transactions.origin.manual')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(() => {
                        const vs = (tx as any).verification_status || 'reported'
                        if (vs === 'verified') return <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" />{t('transactions.verification.verified')}</Badge>
                        if (vs === 'disputed') return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />{t('transactions.verification.disputed')}</Badge>
                        return <Badge variant="secondary" className="gap-1"><ShieldQuestion className="h-3 w-3" />{t('transactions.verification.reported')}</Badge>
                      })()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    {canManageTreasury && (
                      <TableCell>
                        <div className="flex gap-1">
                          {(tx as any).verification_status !== 'verified' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => verifyMut.mutate({ id: tx.id, status: 'verified' })}
                              disabled={verifyMut.isPending}
                              aria-label={t('transactions.action.verify')}
                              title={t('transactions.action.verify')}
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => startEdit(tx)} aria-label={t('transactions.action.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(tx.id)} disabled={deleteTx.isPending} aria-label={t('transactions.action.delete')}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile edit dialog */}
      {isMobile && (
        <Dialog open={!!editingId} onOpenChange={(open) => !open && cancelEdit()}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('transactions.modal.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t('transactions.table.date')}</Label>
                <Input
                  type="date"
                  value={editValues.date || ''}
                  onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('transactions.table.description')}</Label>
                <Input
                  value={editValues.description || ''}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  placeholder={t('transactions.table.description')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('transactions.table.type')}</Label>
                <Select
                  value={editValues.type || ''}
                  onChange={(e) => setEditValues({ ...editValues, type: e.target.value as any })}
                >
                  <option value="income">{t('transactions.badge.income')}</option>
                  <option value="expense">{t('transactions.badge.expense')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('transactions.table.category')}</Label>
                <Select
                  value={editValues.category_id || ''}
                  onChange={(e) => setEditValues({ ...editValues, category_id: e.target.value || null })}
                >
                  <option value="">{t('transactions.edit.noCategory')}</option>
                  {categories?.filter((c) => c.type === editValues.type).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('transactions.table.amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editValues.amount ?? ''}
                  onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                  className="text-right"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelEdit}>{t('transactions.edit.cancel')}</Button>
              <Button onClick={saveEdit} disabled={updateTx.isPending}>
                {updateTx.isPending ? `${t('transactions.edit.save')}...` : t('transactions.edit.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
