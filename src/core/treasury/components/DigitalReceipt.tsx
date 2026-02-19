import { useRef } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Printer } from 'lucide-react'
import type { DigitalReceiptData } from '../services/receipt.service'

interface Props {
  receipt: DigitalReceiptData
  onClose?: () => void
}

export function DigitalReceipt({ receipt, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = ref.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Recibo ${receipt.receiptNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header p { color: #666; margin: 4px 0 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .row .label { color: #666; }
        .row .value { font-weight: 600; }
        .amount { font-size: 28px; text-align: center; font-weight: bold; color: #16a34a; padding: 24px 0; }
        .hash { text-align: center; font-family: monospace; font-size: 12px; color: #999; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #ccc; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-4">
      <div ref={ref}>
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-bold">RECIBO DE PAGO</h2>
              <p className="text-sm text-muted-foreground">{receipt.communityName}</p>
              <p className="text-xs text-muted-foreground mt-1">No. {receipt.receiptNumber}</p>
            </div>

            {/* Amount */}
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(receipt.amount, receipt.currency)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-0">
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">{formatDate(receipt.date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="text-muted-foreground">Miembro</span>
                <span className="font-medium">{receipt.memberName}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="text-muted-foreground">Concepto</span>
                <span className="font-medium">{receipt.concept}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="text-muted-foreground">ID Transaccion</span>
                <span className="font-mono text-xs">{receipt.transactionId.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Verification hash */}
            <div className="text-center pt-4 border-t border-dashed">
              <p className="text-xs text-muted-foreground">Codigo de verificacion</p>
              <p className="font-mono text-sm tracking-wider mt-1">{receipt.verificationHash}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Generado: {formatDate(receipt.generatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5 mr-1" />
          Imprimir
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
