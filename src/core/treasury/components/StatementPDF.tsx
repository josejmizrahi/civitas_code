import { useRef } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Printer } from 'lucide-react'
import type { FinancialStatement } from '../services/statement.service'

interface Props {
  statement: FinancialStatement
  communityName: string
  onClose?: () => void
}

/**
 * Renders a professional financial statement as a printable/downloadable view.
 * Uses browser print for PDF generation (no @react-pdf/renderer dependency
 * needed — simpler and more maintainable).
 */
export function StatementPDF({ statement, communityName, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = contentRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`
      <html><head><title>Estado Financiero ${statement.period}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin: 0; color: #1e40af; }
        .header h2 { font-size: 16px; margin: 6px 0 0; color: #666; font-weight: normal; }
        .header .period { font-size: 14px; color: #888; margin-top: 4px; }
        .summary { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
        .green { color: #16a34a; } .red { color: #dc2626; } .blue { color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; font-size: 13px; text-transform: uppercase; color: #666; }
        td { font-size: 14px; }
        .amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; text-align: center; }
        .approval { margin-top: 24px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const fundLabel = statement.fund_type === 'reserva' ? 'Fondo de Reserva' : 'Fondo de Mantenimiento'

  return (
    <div className="space-y-4">
      <div ref={contentRef}>
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 border-blue-700 pb-5">
              <h1 className="text-xl font-bold text-blue-700">ESTADO FINANCIERO</h1>
              <h2 className="text-base text-muted-foreground mt-1">{communityName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Periodo: {statement.period} — {fundLabel}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Saldo Inicial</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(statement.opening_balance)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ingresos</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(statement.total_income)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Egresos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(statement.total_expense)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Saldo Final</p>
                <p className={`text-lg font-bold ${statement.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(statement.closing_balance)}
                </p>
              </div>
            </div>

            {/* Line Items */}
            {statement.line_items && statement.line_items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Categoria</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Descripcion</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.line_items.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(item.date)}</td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className={`px-3 py-2 text-right font-medium tabular-nums ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(item.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Approval status */}
            {statement.approved && statement.approved_at && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-sm text-green-800 font-medium">
                  Aprobado el {formatDate(statement.approved_at)}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t text-xs text-muted-foreground">
              <p>Generado el {formatDate(statement.generated_at)} — RYVE</p>
              <p className="mt-1">Art. 43 LPCI CDMX — Estado financiero para asamblea de condominos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5 mr-1" />
          Imprimir / PDF
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
    </div>
  )
}
