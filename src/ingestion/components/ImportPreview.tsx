import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/lib/utils'
import type { NormalizedTransaction } from '../types'

interface Props {
  transactions: NormalizedTransaction[]
}

export function ImportPreview({ transactions }: Props) {
  const errors = transactions.filter((t) => t._errors.length > 0)
  const duplicates = transactions.filter((t) => t._isDuplicate)
  const valid = transactions.filter((t) => t._errors.length === 0 && !t._isDuplicate)

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span>Total: <strong>{transactions.length}</strong></span>
        <span className="text-green-600">Válidos: <strong>{valid.length}</strong></span>
        <span className="text-yellow-600">Duplicados: <strong>{duplicates.length}</strong></span>
        <span className="text-red-600">Con errores: <strong>{errors.length}</strong></span>
      </div>

      <div className="max-h-96 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, i) => (
              <TableRow
                key={i}
                className={
                  tx._errors.length > 0
                    ? 'bg-red-50'
                    : tx._isDuplicate
                      ? 'bg-yellow-50'
                      : ''
                }
              >
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{tx.date || '—'}</TableCell>
                <TableCell className="max-w-48 truncate">{tx.description || '—'}</TableCell>
                <TableCell>{tx.category || '—'}</TableCell>
                <TableCell>
                  {tx.type ? (
                    <Badge variant={tx.type === 'income' ? 'success' : 'destructive'}>
                      {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                    </Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {tx.amount !== null ? formatCurrency(tx.amount) : '—'}
                </TableCell>
                <TableCell>
                  {tx._errors.length > 0 ? (
                    <Badge variant="destructive">{tx._errors[0]}</Badge>
                  ) : tx._isDuplicate ? (
                    <Badge variant="warning">Duplicado</Badge>
                  ) : (
                    <Badge variant="success">OK</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
