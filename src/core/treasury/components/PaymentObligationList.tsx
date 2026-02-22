import { useState } from 'react'
import { usePaymentObligations, useUpdateObligationStatus } from '../hooks/usePaymentStatus'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Plus, CheckCircle, Link2 } from 'lucide-react'
import { CreateObligationDialog } from './CreateObligationDialog'
import { RegisterPaymentDialog } from './RegisterPaymentDialog'
import type { PaymentObligation } from '../types'
import { useI18n } from '@/shared/hooks/useI18n'

function statusVariant(status: string): 'warning' | 'success' | 'destructive' | 'secondary' {
  switch (status) {
    case 'paid': return 'success'
    case 'overdue': return 'destructive'
    case 'pending': return 'warning'
    default: return 'secondary'
  }
}

export function PaymentObligationList({ hideSummaryCards = false }: { hideSummaryCards?: boolean }) {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const statusLabels: Record<string, string> = {
    pending: t('obligations.status.pending'),
    paid: t('obligations.status.paid'),
    overdue: t('obligations.status.overdue'),
    partial: t('obligations.status.partial'),
  }

  const [showCreate, setShowCreate] = useState(false)
  const [payObligation, setPayObligation] = useState<PaymentObligation | null>(null)
  const { data: obligations, isLoading } = usePaymentObligations()
  const { data: members } = useMembers()
  const { canManageTreasury } = usePermissions()
  const updateStatus = useUpdateObligationStatus()

  const memberMap = new Map(members?.map((m) => [m.id, m.full_name || m.email || m.id]) ?? [])

  const filtered = statusFilter
    ? obligations?.filter((o) => o.status === statusFilter)
    : obligations

  const handleStatusChange = (obligation: PaymentObligation, newStatus: string) => {
    if (newStatus === 'paid') {
      setPayObligation(obligation)
      return
    }
    updateStatus.mutate({ id: obligation.id, status: newStatus })
  }

  return (
    <div className="space-y-4">
      {!hideSummaryCards && (() => {
        const pendingCount = obligations?.filter(o => o.status === 'pending').length ?? 0
        const overdueCount = obligations?.filter(o => o.status === 'overdue').length ?? 0
        const paidCount = obligations?.filter(o => o.status === 'paid').length ?? 0
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-yellow-50 p-3">
              <div className="text-sm text-yellow-700">{t('obligations.summary.pending')}</div>
              <div className="text-xl font-bold text-yellow-800">{pendingCount}</div>
            </div>
            <div className="rounded-lg border bg-red-50 p-3">
              <div className="text-sm text-red-700">{t('obligations.summary.overdue')}</div>
              <div className="text-xl font-bold text-red-800">{overdueCount}</div>
            </div>
            <div className="rounded-lg border bg-green-50 p-3">
              <div className="text-sm text-green-700">{t('obligations.summary.paid')}</div>
              <div className="text-xl font-bold text-green-800">{paidCount}</div>
            </div>
          </div>
        )
      })()}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-48">
          <option value="">{t('obligations.filter.allStatuses')}</option>
          <option value="pending">{t('obligations.status.pending')}</option>
          <option value="paid">{t('obligations.status.paid')}</option>
          <option value="overdue">{t('obligations.status.overdue')}</option>
          <option value="partial">{t('obligations.status.partial')}</option>
        </Select>
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('obligations.new')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('obligations.table.member')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('obligations.table.concept')}</TableHead>
              <TableHead className="text-right">{t('obligations.table.amount')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('obligations.table.dueDate')}</TableHead>
              <TableHead>{t('obligations.table.status')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('obligations.table.link')}</TableHead>
              {canManageTreasury && <TableHead>{t('obligations.table.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 7 : 6} className="text-center text-muted-foreground">
                  {t('obligations.table.loading')}
                </TableCell>
              </TableRow>
            ) : !filtered || filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 7 : 6} className="text-center text-muted-foreground">
                  {t('obligations.table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ob) => (
                <TableRow key={ob.id}>
                  <TableCell className="font-medium">{memberMap.get(ob.member_id) || ob.member_id.slice(0, 8)}</TableCell>
                  <TableCell className="hidden md:table-cell">{ob.concept}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(ob.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(ob.due_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(ob.status)}>
                      {statusLabels[ob.status] || ob.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {ob.payment_transaction_id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Link2 className="h-3 w-3" /> {t('obligations.linkedTx')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canManageTreasury && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ob.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPayObligation(ob)}
                            className="text-xs"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t('obligations.registerPayment')}
                          </Button>
                        )}
                        {ob.status !== 'paid' && (
                          <Select
                            value={ob.status}
                            onChange={(e) => handleStatusChange(ob, e.target.value)}
                            className="w-28 text-xs"
                          >
                            <option value="pending">{t('obligations.status.pending')}</option>
                            <option value="paid">{t('obligations.status.paid')}</option>
                            <option value="overdue">{t('obligations.status.overdue')}</option>
                            <option value="partial">{t('obligations.status.partial')}</option>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateObligationDialog open={showCreate} onOpenChange={setShowCreate} />
      <RegisterPaymentDialog
        open={!!payObligation}
        onOpenChange={(open) => { if (!open) setPayObligation(null) }}
        obligation={payObligation}
      />
    </div>
  )
}
