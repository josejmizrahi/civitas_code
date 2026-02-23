import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency, formatDate, downloadAsCSV, downloadAsExcel } from '@/shared/lib/utils'
import { Download, ShieldCheck, ShieldAlert, ShieldQuestion, FileEdit, FileText, Flag } from 'lucide-react'
import { CorrectionDialog } from './CorrectionDialog'
import { TransactionDetailDialog } from './TransactionDetailDialog'
import { FlagVigilanceDialog } from './FlagVigilanceDialog'
import type { Transaction } from '../types'
import { useToast } from '@/shared/components/ui/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyTransaction } from '../services/receipt.service'
import type { FundType } from '@/shared/types/rules'
import { useI18n } from '@/shared/hooks/useI18n'

export function TransactionList({ fundType }: { fundType?: FundType } = {}) {
  const { t } = useI18n()
  const [type, setType] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [correctionTx, setCorrectionTx] = useState<Transaction | null>(null)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [flagTx, setFlagTx] = useState<Transaction | null>(null)

  const { communityId } = useCommunityContext()
  const { canManageTreasury, role, isAdmin } = usePermissions()
  const toast = useToast()
  const queryClient = useQueryClient()
  const canFlagVigilance = role === 'comite_vigilancia' || isAdmin

  const verifyMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'disputed' }) =>
      verifyTransaction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success(t('transactions.toast.verified'))
    },
    onError: () => toast.error(t('transactions.toast.verifyError')),
  })

  void communityId

  const filters = {
    ...(type && { type }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(fundType && { fundType }),
  }

  const hasFilters = fundType || type || dateFrom || dateTo
  const { data: transactions, isLoading } = useTransactions(hasFilters ? filters : undefined)

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
              {(canManageTreasury || canFlagVigilance) && <TableHead className="w-32">{t('transactions.table.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={(canManageTreasury || canFlagVigilance) ? 8 : 7} className="text-center text-muted-foreground">{t('transactions.table.loading')}</TableCell>
              </TableRow>
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(canManageTreasury || canFlagVigilance) ? 8 : 7} className="text-center text-muted-foreground">
                  {t('transactions.table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => {
                return (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetailTx(tx)}
                  >
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
                    {(canManageTreasury || canFlagVigilance) && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDetailTx(tx)}
                            aria-label="Ver detalle"
                            title="Ver detalle"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canManageTreasury && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setCorrectionTx(tx)}
                                aria-label="Registrar corrección"
                                title="Registrar corrección"
                              >
                                <FileEdit className="h-4 w-4" />
                              </Button>
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
                            </>
                          )}
                          {canFlagVigilance && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setFlagTx(tx)}
                              aria-label="Marcar para vigilancia"
                              title="Marcar para vigilancia"
                            >
                              <Flag className={`h-4 w-4 ${(tx as any).vigilance_flag ? 'text-amber-600' : ''}`} />
                            </Button>
                          )}
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

      <p className="text-xs text-muted-foreground">
        Las transacciones son inmutables. Para corregir un movimiento, usa el botón de corrección en cada fila.
      </p>
      {correctionTx && (
        <CorrectionDialog
          open={!!correctionTx}
          onOpenChange={(open) => !open && setCorrectionTx(null)}
          transaction={correctionTx}
        />
      )}
      {detailTx && (
        <TransactionDetailDialog
          open={!!detailTx}
          onOpenChange={(open) => !open && setDetailTx(null)}
          transaction={detailTx}
        />
      )}
      {flagTx && (
        <FlagVigilanceDialog
          open={!!flagTx}
          onOpenChange={(open) => !open && setFlagTx(null)}
          transaction={flagTx}
        />
      )}
    </div>
  )
}
