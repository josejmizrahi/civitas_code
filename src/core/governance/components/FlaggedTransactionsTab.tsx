import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useSetVigilanceFlag } from '@/core/treasury/hooks/useTransactions'
import { useTenant } from '@/shared/hooks/useTenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Flag, FlagOff } from 'lucide-react'
import type { Transaction } from '@/core/treasury/types'

export function FlaggedTransactionsTab() {
  const { communityId } = useCommunityContext()
  const navigate = useNavigate()
  const { membership } = useTenant()
  const memberId = membership?.id ?? null
  const setFlag = useSetVigilanceFlag()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const { data: flagged, isLoading } = useQuery({
    queryKey: ['transactions-flagged', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('community_id', communityId!)
        .eq('vigilance_flag', true)
        .order('date', { ascending: false })
      return (data ?? []).map((r: any) => ({ ...r, category_name: r.categories?.name })) as Transaction[]
    },
    enabled: !!communityId,
  })

  const handleUnflag = (txId: string) => {
    if (!memberId) return
    setFlag.mutate(
      { transactionId: txId, flag: false, memberId },
      { onSuccess: () => setEditingId(null) }
    )
  }

  const handleSaveNote = (txId: string) => {
    if (!memberId) return
    setFlag.mutate(
      { transactionId: txId, flag: true, note: note || undefined, memberId },
      { onSuccess: () => { setEditingId(null); setNote('') } }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4" />
          Transacciones marcadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : !flagged?.length ? (
          <p className="text-sm text-muted-foreground">Ninguna transacción marcada.</p>
        ) : (
          <div className="space-y-3">
            {flagged.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div
                    className="cursor-pointer font-medium"
                    onClick={() => navigate(`/treasury?tx=${tx.id}`)}
                  >
                    {tx.description} · {formatCurrency(Number(tx.amount))} · {formatDate(tx.date)}
                  </div>
                  <div className="flex gap-1">
                    {editingId === tx.id ? (
                      <>
                        <Input
                          placeholder="Observación"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button size="sm" onClick={() => handleSaveNote(tx.id)} disabled={setFlag.isPending}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setNote('') }}>
                          Cerrar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(tx.id); setNote(tx.vigilance_note ?? '') }}>
                          Editar nota
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnflag(tx.id)}
                          disabled={setFlag.isPending}
                        >
                          <FlagOff className="h-3 w-3" /> Quitar marca
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {tx.vigilance_note && (
                  <p className="text-sm text-muted-foreground border-l-2 border-muted-foreground/30 pl-2">
                    {tx.vigilance_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
