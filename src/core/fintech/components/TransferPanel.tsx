import { useState } from 'react'
import { useTransfers, useCreateTransfer, useFintechStatus } from '../hooks/useFintech'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useToast } from '@/shared/components/ui/toast'
import { ArrowUpRight, Plus, Banknote } from 'lucide-react'

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  succeeded: { label: 'Enviada', variant: 'default' },
  failed: { label: 'Fallida', variant: 'destructive' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  returned: { label: 'Devuelta', variant: 'destructive' },
}

export function TransferPanel() {
  const { data: status } = useFintechStatus()
  const { data: transfers, isLoading } = useTransfers()
  const createTransfer = useCreateTransfer()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [clabe, setClabe] = useState('')
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')

  if (status?.fintech_status !== 'active') {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Banknote className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Activa la integración financiera para realizar transferencias SPEI</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransfer.mutateAsync({
        amount: Math.round(parseFloat(amount) * 100),
        counterparty_clabe: clabe.trim(),
        counterparty_name: name.trim() || undefined,
        comment: comment.trim() || undefined,
      })
      toast.success('Transferencia enviada')
      setShowForm(false)
      setAmount('')
      setClabe('')
      setName('')
      setComment('')
    } catch {
      toast.error('Error al enviar transferencia')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{transfers?.length ?? 0} transferencias</p>
        <Button onClick={() => setShowForm(true)} className="gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Nueva transferencia
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-8" />
      ) : !transfers?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ArrowUpRight className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin transferencias realizadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => {
            const badge = STATUS_BADGES[t.status] || STATUS_BADGES.pending
            return (
              <Card key={t.id} className="rounded-xl">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-sm font-semibold">
                          ${(t.amount / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.counterparty_name || 'Sin nombre'} · {t.counterparty_clabe}
                      </p>
                      {t.comment && <p className="text-xs text-muted-foreground">{t.comment}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>Nueva transferencia SPEI</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Monto (MXN)</Label>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="1000.00" />
              </div>
              <div className="space-y-2">
                <Label>CLABE destino</Label>
                <Input value={clabe} onChange={(e) => setClabe(e.target.value)} required maxLength={18} placeholder="012969..." className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Nombre beneficiario (opcional)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del proveedor" />
              </div>
              <div className="space-y-2">
                <Label>Concepto (opcional)</Label>
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Pago de servicio..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTransfer.isPending}>
                {createTransfer.isPending ? 'Enviando...' : 'Enviar transferencia'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
