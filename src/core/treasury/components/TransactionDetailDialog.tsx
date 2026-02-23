import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import { getAuditLog } from '@/shared/services/audit.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import { FileText, History, Link2 } from 'lucide-react'
import type { Transaction } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
}

export function TransactionDetailDialog({ open, onOpenChange, transaction }: Props) {
  const { communityId } = useCommunityContext()

  const { data: corrections } = useQuery({
    queryKey: ['transaction-corrections', transaction.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('community_id', communityId!)
        .eq('correction_of', transaction.id)
        .order('date', { ascending: false })
      return (data ?? []).map((r: any) => ({ ...r, category_name: r.categories?.name })) as Transaction[]
    },
    enabled: open && !!communityId,
  })

  const { data: auditEntries } = useQuery({
    queryKey: ['audit-log-transaction', transaction.id],
    queryFn: () => getAuditLog(communityId!, { entityType: 'transaction', entityId: transaction.id, limit: 30 }),
    enabled: open && !!communityId,
  })

  const { data: original } = useQuery({
    queryKey: ['transaction-original', transaction.correction_of],
    queryFn: async () => {
      if (!transaction.correction_of) return null
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('id', transaction.correction_of!)
        .single()
      return data ? { ...data, category_name: (data as any).categories?.name } as any : null
    },
    enabled: open && !!transaction.correction_of,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalle de transacción
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Datos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Fecha</span>
              <span>{formatDate(transaction.date)}</span>
              <span className="text-muted-foreground">Tipo</span>
              <span><Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>{transaction.type === 'income' ? 'Ingreso' : 'Egreso'}</Badge></span>
              <span className="text-muted-foreground">Monto</span>
              <span className="font-medium">{transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}</span>
              <span className="text-muted-foreground">Categoría</span>
              <span>{(transaction as any).category_name ?? transaction.category_id ?? '—'}</span>
              <span className="text-muted-foreground">Descripción</span>
              <span>{transaction.description || '—'}</span>
              <span className="text-muted-foreground">Origen</span>
              <span>{(transaction as any).origin ?? 'manual'}</span>
              {(transaction as any).verification_status && (
                <>
                  <span className="text-muted-foreground">Verificación</span>
                  <span>{(transaction as any).verification_status}</span>
                </>
              )}
              {transaction.vigilance_flag && (
                <>
                  <span className="text-muted-foreground">Marcada vigilancia</span>
                  <span>{transaction.vigilance_note || 'Sí'}</span>
                </>
              )}
              {transaction.correction_of && (
                <>
                  <span className="text-muted-foreground">Corrección de</span>
                  <span className="font-mono text-xs">{transaction.correction_of}</span>
                </>
              )}
              {transaction.correction_note && (
                <>
                  <span className="text-muted-foreground">Nota de corrección</span>
                  <span>{transaction.correction_note}</span>
                </>
              )}
            </CardContent>
          </Card>

          {original && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Transacción original
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{original.description} · {formatCurrency(Number(original.amount))} · {formatDate(original.date)}</p>
                {original.correction_note && <p className="text-muted-foreground mt-1">{original.correction_note}</p>}
              </CardContent>
            </Card>
          )}

          {corrections && corrections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Correcciones vinculadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {corrections.map((c) => (
                  <div key={c.id} className="flex justify-between items-start text-sm border-l-2 border-muted pl-2">
                    <span>{c.description} · {formatCurrency(Number(c.amount))} · {formatDate(c.date)}</span>
                    {c.correction_note && <span className="text-muted-foreground text-xs">{c.correction_note}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <History className="h-3 w-3" />
                Audit trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!auditEntries?.length ? (
                <p className="text-sm text-muted-foreground">Sin entradas en el registro de auditoría.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {auditEntries.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                      <span className="font-medium">{e.action}</span>
                      <span className="text-muted-foreground">{formatDateTime(e.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
