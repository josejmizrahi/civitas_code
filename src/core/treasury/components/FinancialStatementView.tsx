import { useState } from 'react'
import { useStatement, useApproveStatement } from '../hooks/useStatements'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { CheckCircle, Printer, ArrowLeft } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import type { FinancialStatement } from '../services/statement.service'

interface FinancialStatementViewProps {
  statementId: string
  onBack: () => void
}

const FUND_LABELS: Record<string, string> = {
  mantenimiento: 'Mantenimiento',
  reserva: 'Reserva',
}

/**
 * Detailed view of a single financial statement.
 * Shows opening/closing balance, line items, and approval controls.
 */
export function FinancialStatementView({ statementId, onBack }: FinancialStatementViewProps) {
  const { data: statement, isLoading } = useStatement(statementId)
  const approveStatement = useApproveStatement()
  const { canManageTreasury } = usePermissions()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  const handleApprove = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    try {
      await approveStatement.mutateAsync(statementId)
      toast.success('Estado financiero aprobado')
      setConfirming(false)
    } catch {
      toast.error('Error al aprobar estado financiero')
      setConfirming(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) return <LoadingSpinner message="Cargando estado financiero..." className="py-8" />
  if (!statement) return <p className="text-muted-foreground">Estado financiero no encontrado.</p>

  const incomeItems = (statement.line_items ?? []).filter((item) => Number(item.amount) > 0)
  const expenseItems = (statement.line_items ?? []).filter((item) => Number(item.amount) < 0)

  // Group line items by type based on category patterns or just show all
  const allItems = statement.line_items ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              Estado Financiero — {statement.period}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {FUND_LABELS[statement.fund_type] || statement.fund_type}
              </Badge>
              {statement.approved ? (
                <Badge variant="success">Aprobado</Badge>
              ) : (
                <Badge variant="warning">Pendiente</Badge>
              )}
              {statement.generated_at && (
                <span>Generado: {formatDate(statement.generated_at)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {canManageTreasury && !statement.approved && (
            <Button
              size="sm"
              variant={confirming ? 'default' : 'outline'}
              onClick={handleApprove}
              disabled={approveStatement.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {confirming ? 'Confirmar Aprobacion' : 'Aprobar'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Saldo Inicial"
          value={formatCurrency(statement.opening_balance)}
          className="text-muted-foreground"
        />
        <SummaryCard
          label="Ingresos del Periodo"
          value={`+${formatCurrency(statement.total_income)}`}
          className="text-green-600"
        />
        <SummaryCard
          label="Egresos del Periodo"
          value={`-${formatCurrency(statement.total_expense)}`}
          className="text-red-600"
        />
        <SummaryCard
          label="Saldo Final"
          value={formatCurrency(statement.closing_balance)}
          className={statement.closing_balance >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}
        />
      </div>

      {/* Line Items Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Detalle de Movimientos
        </h3>
        {allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos en este periodo.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Descripcion</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{item.description || '\u2014'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Approval Info */}
      {statement.approved && statement.approved_at && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>
              Aprobado el {formatDate(statement.approved_at)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== HELPER COMPONENT ====================

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-lg sm:text-xl font-semibold ${className || ''}`}>{value}</p>
    </div>
  )
}
