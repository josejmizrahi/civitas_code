import { useCommunityContext } from '@/app/providers'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { MyPayments } from '@/core/treasury/components/MyPayments'
import { FinancialSummaryCompact } from '@/core/treasury/components/FinancialSummaryCompact'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatCurrency } from '@/shared/lib/utils'
import { useI18n } from '@/shared/hooks/useI18n'
import { Wallet, CheckCircle2, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

export function MemberTreasuryView() {
  const { t } = useI18n()
  const { currentMember } = useCommunityContext()
  const { data: obligations, isLoading } = usePaymentObligations(currentMember?.id)

  const pendingObs = obligations?.filter((o) => o.status === 'pending' || o.status === 'overdue') ?? []
  const paidObs = obligations?.filter((o) => o.status === 'paid') ?? []
  const totalPending = pendingObs.reduce((sum, o) => sum + o.amount, 0)
  const totalPaid = paidObs.reduce((sum, o) => sum + o.amount, 0)
  const statusLabel =
    pendingObs.some((o) => o.status === 'overdue')
      ? t('treasury.member.status.moroso')
      : pendingObs.length > 0
        ? t('treasury.member.status.pendiente')
        : t('treasury.member.status.alCorriente')
  const statusVariant =
    pendingObs.some((o) => o.status === 'overdue') ? 'destructive' : pendingObs.length > 0 ? 'warning' : 'success'

  if (isLoading) return <LoadingSpinner message={t('treasury.member.loading')} className="py-12" />

  return (
    <div id="treasury-content" className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t('treasury.title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('treasury.member.subtitle')}</p>
      </header>

      {/* 3 compact cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="rounded-xl border-border/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              {t('treasury.member.totalPendiente')}
            </div>
            <p className={`mt-1 text-xl font-bold ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('treasury.member.totalPagado')}
            </div>
            <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              {t('treasury.member.estadoFinanciero')}
            </div>
            <p className="mt-1 text-xl font-bold">
              <span
                className={
                  statusVariant === 'destructive'
                    ? 'text-red-600'
                    : statusVariant === 'warning'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }
              >
                {statusLabel}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My payments: instructions + obligations table (no duplicate summary cards) */}
      <MyPayments showSummaryCards={false} />

      {/* Community financial summary (compact) */}
      <section aria-label={t('treasury.member.resumenComunidad')}>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('treasury.member.resumenComunidad')}</h2>
        <FinancialSummaryCompact />
      </section>
    </div>
  )
}
