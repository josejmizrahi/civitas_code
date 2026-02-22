import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import {
  useCreateDiscretionaryApproval,
  useDiscretionaryApprovals,
  useRespondDiscretionaryApproval,
} from '../hooks/useDiscretionary'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import type { DiscretionaryApproval } from '../types'

function DiscretionaryApprovalCard({
  approval,
  canRespond,
  currentMemberId,
  responseNote,
  onResponseNoteChange,
  onRespond,
  isResponding,
}: {
  approval: DiscretionaryApproval
  canRespond: boolean
  currentMemberId: string | null
  responseNote: string
  onResponseNoteChange: (note: string) => void
  onRespond: (decision: 'approved' | 'rejected') => void
  isResponding: boolean
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{formatCurrency(approval.amount)}</p>
        <Badge
          variant={
            approval.status === 'approved'
              ? 'success'
              : approval.status === 'rejected'
                ? 'destructive'
                : 'secondary'
          }
        >
          {approval.status === 'pending' ? 'Pendiente' : approval.status === 'approved' ? 'Aprobada' : 'Rechazada'}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{approval.description}</p>
      <p className="text-xs text-muted-foreground">Creada: {formatDate(approval.created_at)}</p>
      {approval.response_note && (
        <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">
          Respuesta: {approval.response_note}
        </p>
      )}
      {approval.status === 'approved' && approval.transaction_id && (
        <p className="text-xs text-green-700">
          Transacción registrada.{' '}
          <Link to="/treasury" className="underline hover:no-underline">
            Ver en Tesorería
          </Link>
        </p>
      )}
      {canRespond && approval.status === 'pending' && currentMemberId && (
        <div className="space-y-2 pt-1">
          <Label className="text-xs text-muted-foreground">Nota (opcional)</Label>
          <Textarea
            placeholder="Ej. motivo de rechazo o observación"
            value={responseNote}
            onChange={(e) => onResponseNoteChange(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onRespond('approved')}
              disabled={isResponding}
            >
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRespond('rejected')}
              disabled={isResponding}
            >
              Rechazar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DiscretionaryApprovalsPanel() {
  const { currentMember } = useCommunityContext()
  const { role, canManageTreasury, isAdmin } = usePermissions()
  const { data: approvals, isLoading } = useDiscretionaryApprovals()
  const createMut = useCreateDiscretionaryApproval()
  const respondMut = useRespondDiscretionaryApproval()

  const canRequest = canManageTreasury
  const canRespond = role === 'comite_vigilancia' || isAdmin

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [responseNoteByApproval, setResponseNoteByApproval] = useState<Record<string, string>>({})

  const visibleApprovals = (approvals ?? []).filter((approval) =>
    filter === 'all' ? true : approval.status === 'pending',
  )
  const pendingCount = (approvals ?? []).filter((approval) => approval.status === 'pending').length

  const handleCreate = () => {
    if (!currentMember?.id || !amount || !description.trim()) return
    createMut.mutate({
      requested_by_member_id: currentMember.id,
      amount: Number(amount),
      description: description.trim(),
    }, {
      onSuccess: () => {
        setAmount('')
        setDescription('')
      },
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aprobaciones discrecionales (Nivel 2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canRequest ? (
            <>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del gasto discrecional"
                rows={3}
              />
              <Button
                onClick={handleCreate}
                disabled={createMut.isPending || Number(amount) <= 0 || !description.trim()}
              >
                {createMut.isPending ? 'Enviando...' : 'Solicitar aprobación'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Solo admin y tesorero pueden solicitar gastos discrecionales.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Solicitudes</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Pendientes: {pendingCount}</Badge>
              <Button
                size="sm"
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
              >
                Pendientes
              </Button>
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>}
          {!isLoading && visibleApprovals.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay solicitudes discrecionales.</p>
          )}
          {visibleApprovals.map((approval) => (
            <DiscretionaryApprovalCard
              key={approval.id}
              approval={approval}
              canRespond={canRespond}
              currentMemberId={currentMember?.id ?? null}
              responseNote={responseNoteByApproval[approval.id] ?? ''}
              onResponseNoteChange={(note) =>
                setResponseNoteByApproval((prev) => ({ ...prev, [approval.id]: note }))
              }
              onRespond={(decision) => {
                if (!currentMember?.id) return
                respondMut.mutate({
                  approvalId: approval.id,
                  responderMemberId: currentMember.id,
                  decision,
                  responseNote: responseNoteByApproval[approval.id]?.trim() || undefined,
                })
                setResponseNoteByApproval((prev) => ({ ...prev, [approval.id]: '' }))
              }}
              isResponding={respondMut.isPending}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
