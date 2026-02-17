import { useState } from 'react'
import { useStatements, useGenerateStatement } from '../hooks/useStatements'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Plus, FileText, Eye } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { FinancialStatementView } from './FinancialStatementView'
import type { FundType } from '@/shared/types/rules'

interface StatementListProps {
  fundType?: FundType
}

const FUND_LABELS: Record<string, string> = {
  mantenimiento: 'Mantenimiento',
  reserva: 'Reserva',
}

/**
 * List of generated financial statements with filtering and generation controls.
 * LPCI CDMX Art. 43 requires monthly financial statements.
 */
export function StatementList({ fundType }: StatementListProps) {
  const { data: statements, isLoading } = useStatements(fundType)
  const generateStatement = useGenerateStatement()
  const { canManageTreasury } = usePermissions()
  const toast = useToast()

  const [showGenerate, setShowGenerate] = useState(false)
  const [genPeriod, setGenPeriod] = useState('')
  const [genFundType, setGenFundType] = useState<string>(fundType || 'mantenimiento')
  const [genError, setGenError] = useState('')

  const [viewingId, setViewingId] = useState<string | null>(null)

  // Default period to current month
  const defaultPeriod = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const openGenerate = () => {
    setGenPeriod(defaultPeriod())
    setGenFundType(fundType || 'mantenimiento')
    setGenError('')
    setShowGenerate(true)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenError('')

    if (!genPeriod) {
      setGenError('El periodo es obligatorio')
      return
    }

    // Validate period format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(genPeriod)) {
      setGenError('Formato de periodo invalido. Usa YYYY-MM (ej. 2026-01)')
      return
    }

    try {
      await generateStatement.mutateAsync({
        period: genPeriod,
        fundType: genFundType,
      })
      toast.success('Estado financiero generado correctamente')
      setShowGenerate(false)
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Error al generar estado financiero')
    }
  }

  // If viewing a specific statement, show the detail view
  if (viewingId) {
    return (
      <FinancialStatementView
        statementId={viewingId}
        onBack={() => setViewingId(null)}
      />
    )
  }

  if (isLoading) return <LoadingSpinner message="Cargando estados financieros..." className="py-8" />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Estados Financieros</h3>
          {fundType && (
            <Badge variant="secondary">{FUND_LABELS[fundType]}</Badge>
          )}
        </div>
        {canManageTreasury && (
          <Button size="sm" onClick={openGenerate}>
            <Plus className="mr-2 h-4 w-4" />
            Generar Estado
          </Button>
        )}
      </div>

      {/* Statements Table */}
      {!statements || statements.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No hay estados financieros generados.
          </p>
          {canManageTreasury && (
            <p className="mt-1 text-xs text-muted-foreground">
              Genera el primer estado de cuenta mensual para cumplir con Art. 43 LPCI CDMX.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Fondo</TableHead>
                <TableHead className="text-right">Saldo Inicial</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
                <TableHead className="text-right">Saldo Final</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Generado</TableHead>
                <TableHead className="w-16">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((stmt) => (
                <TableRow key={stmt.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{stmt.period}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {FUND_LABELS[stmt.fund_type] || stmt.fund_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(stmt.opening_balance)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatCurrency(stmt.total_income)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(stmt.total_expense)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(stmt.closing_balance)}
                  </TableCell>
                  <TableCell>
                    {stmt.approved ? (
                      <Badge variant="success">Aprobado</Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(stmt.generated_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setViewingId(stmt.id)}
                      aria-label="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Generate Statement Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent onClose={() => setShowGenerate(false)}>
          <DialogHeader>
            <DialogTitle>Generar Estado Financiero</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate}>
            <div className="space-y-4 py-4">
              {genError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {genError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Periodo (YYYY-MM)</Label>
                <Input
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  placeholder="2026-01"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato: Anio-Mes (ej. 2026-01 para enero 2026)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Fondo</Label>
                <Select
                  value={genFundType}
                  onChange={(e) => setGenFundType(e.target.value)}
                >
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reserva">Reserva</option>
                </Select>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                El estado financiero se generara automaticamente con las transacciones
                registradas del periodo seleccionado. Si ya existe un estado para este
                periodo y fondo, sera reemplazado.
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGenerate(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={generateStatement.isPending}>
                {generateStatement.isPending ? 'Generando...' : 'Generar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
