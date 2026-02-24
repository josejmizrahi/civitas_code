import { useCommunityContext } from '@/app/providers'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePaymentObligations } from '../hooks/usePaymentStatus'
import { getCollectionConfig, generatePaymentReference } from '../services/treasury.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { AlertTriangle, CheckCircle2, Clock, Building2, Copy } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useState } from 'react'
import type { TreasuryRules } from '@/shared/types/rules'
import { PaymentButton } from '@/core/fintech/components/PaymentButton'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  partial: 'Parcial',
}

function statusIcon(status: string) {
  switch (status) {
    case 'paid': return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
    default: return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

const PAYMENT_VARIANTS: Record<string, 'warning' | 'success' | 'destructive'> = {
  paid: 'success',
  overdue: 'destructive',
  pending: 'warning',
}

export function MyPayments({ showSummaryCards = true }: { showSummaryCards?: boolean }) {
  const { currentMember, community } = useCommunityContext()
  const { data: obligations, isLoading } = usePaymentObligations(currentMember?.id)
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const collectionConfig = getCollectionConfig(rules)
  const hasClabe = !!collectionConfig.clabe

  const pendingObs = obligations?.filter(o => o.status === 'pending' || o.status === 'overdue') ?? []
  const paidObs = obligations?.filter(o => o.status === 'paid') ?? []
  const totalPending = pendingObs.reduce((sum, o) => sum + o.amount, 0)
  const totalPaid = paidObs.reduce((sum, o) => sum + o.amount, 0)

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(null), 2000)
  }

  if (isLoading) return <LoadingSpinner message="Cargando tus pagos..." className="py-8" />

  return (
    <div className="space-y-6">
      {/* Summary — optional when embedded in MemberTreasuryView */}
      {showSummaryCards && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Pendiente</div>
            <div className={`text-xl sm:text-2xl font-bold ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">{pendingObs.length} pagos pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Pagado</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{paidObs.length} pagos realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Estatus Financiero</div>
            <div className="text-xl sm:text-2xl font-bold">
              {pendingObs.some(o => o.status === 'overdue') ? (
                <span className="text-red-600">Moroso</span>
              ) : pendingObs.length > 0 ? (
                <span className="text-yellow-600">Pendiente</span>
              ) : (
                <span className="text-green-600">Al corriente</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Payment instructions */}
      {pendingObs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Instrucciones de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Puedes pagar tus obligaciones directamente con transferencia SPEI.
                Haz clic en "Pagar con SPEI" en la tabla de abajo, o realiza una transferencia manual a la CLABE indicada.
              </p>
              {hasClabe && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">CLABE para transferencia manual</div>
                    <code className="text-sm sm:text-lg font-mono font-bold tracking-wider break-all">{collectionConfig.clabe}</code>
                  </div>
                  {collectionConfig.beneficiary_name && (
                    <div>
                      <div className="text-xs text-muted-foreground">Beneficiario</div>
                      <div className="font-medium">{collectionConfig.beneficiary_name}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Obligations list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Obligaciones de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {!obligations || obligations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No tienes obligaciones de pago registradas.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimiento</TableHead>
                  {hasClabe && <TableHead className="hidden sm:table-cell">Referencia</TableHead>}
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map((ob) => {
                  const ref = generatePaymentReference(collectionConfig.payment_reference_prefix, ob.id)
                  return (
                    <TableRow key={ob.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(ob.status)}
                          <StatusBadge status={ob.status} variantMap={PAYMENT_VARIANTS} labelMap={statusLabels} />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{ob.concept}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(ob.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(ob.due_date)}</TableCell>
                      {hasClabe && (
                        <TableCell className="hidden sm:table-cell">
                          {ob.status !== 'paid' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyRef(ref)}
                              className="font-mono text-xs"
                            >
                              {ref}
                              <Copy className="ml-1 h-3 w-3" />
                              {copiedRef === ref && <span className="ml-1 text-green-600">Copiado</span>}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {(ob.status === 'pending' || ob.status === 'overdue') && (
                          <PaymentButton
                            obligationId={ob.id}
                            amount={ob.amount}
                            concept={ob.concept}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
