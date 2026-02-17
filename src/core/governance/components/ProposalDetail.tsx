import { useEffect, useState } from 'react'
import { useProposal, useUpdateProposalStatus } from '../hooks/useProposals'
import { useVotes, useVoteSummary, useCloseProposal, useExecuteProposal } from '../hooks/useVoting'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useAuth, useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { VotingPanel } from './VotingPanel'
import { QuorumIndicator } from './QuorumIndicator'
import { MinutesGenerator } from './MinutesGenerator'
import { DelegationManager } from './DelegationManager'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatDate, formatDateTime } from '@/shared/lib/utils'
import { Clock, AlertTriangle, Play, CheckCircle2, Timer, XCircle } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'

interface Props {
  proposalId: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activa',
  closed: 'Cerrada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const update = () => {
      const end = new Date(endDate).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Expirado')
        setExpired(true)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      else setTimeLeft(`${minutes}m ${seconds}s`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${expired ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
      {expired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      {expired ? 'Tiempo de votación expirado' : `Tiempo restante: ${timeLeft}`}
    </div>
  )
}

export function ProposalDetail({ proposalId }: Props) {
  const { user } = useAuth()
  const { communityId } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const { data: proposal, isLoading, refetch: refetchProposal } = useProposal(proposalId)
  const { data: members } = useMembers()
  const { data: votes } = useVotes(proposalId)
  const updateStatus = useUpdateProposalStatus()
  const closeProposalMut = useCloseProposal()
  const executeMut = useExecuteProposal()
  const toast = useToast()

  const { data: voteSummary } = useVoteSummary(
    proposalId,
    proposal?.quorum_required ?? 0.5,
    proposal?.majority_required ?? 0.5
  )

  const currentMember = members?.find((m) => m.user_id === user?.id)

  // B4: Auto-close if voting_end has passed and proposal is still active
  useEffect(() => {
    if (!proposal || !user) return
    if (proposal.status === 'active' && proposal.voting_end) {
      const end = new Date(proposal.voting_end).getTime()
      if (Date.now() > end) {
        closeProposalMut.mutate(
          { proposalId, userId: user.id },
          { onSuccess: () => refetchProposal() }
        )
      }
    }
  }, [proposal?.status, proposal?.voting_end])

  if (isLoading) return <LoadingSpinner message="Cargando propuesta..." className="py-12" />
  if (!proposal) return <div className="text-muted-foreground">Propuesta no encontrada.</div>

  const canActivate = proposal.status === 'draft'
  const canClose = proposal.status === 'active'
  const isVotingOpen = proposal.status === 'active' &&
    (!proposal.voting_end || new Date(proposal.voting_end) > new Date())
  const isClosed = ['closed', 'approved', 'rejected'].includes(proposal.status)

  const handleActivate = () => {
    updateStatus.mutate({ proposalId, status: 'active' }, {
      onSuccess: () => toast.success('Votación abierta'),
      onError: () => toast.error('Error al abrir votación'),
    })
  }

  const handleClose = () => {
    if (!user) return
    closeProposalMut.mutate(
      { proposalId, userId: user.id },
      { onSuccess: () => refetchProposal() }
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>{proposal.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {proposal.result && (
                <Badge variant="outline" className="text-xs">{proposal.result}</Badge>
              )}
              <Badge variant={proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'destructive' : 'default'}>
                {STATUS_LABELS[proposal.status] || proposal.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{proposal.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Creada: {formatDate(proposal.created_at)}</span>
            {proposal.voting_start && <span>Inicio: {formatDate(proposal.voting_start)}</span>}
            {proposal.voting_end && <span>Cierre: {formatDate(proposal.voting_end)}</span>}
            <span>Quórum: {(proposal.quorum_required * 100).toFixed(0)}%</span>
            <span>Mayoría: {(proposal.majority_required * 100).toFixed(0)}%</span>
          </div>

          {proposal.closed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cerrada</span>
              <span>{formatDateTime(proposal.closed_at)}</span>
            </div>
          )}
          {proposal.closed_at && !proposal.closed_by && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Método</span>
              <Badge variant="secondary">Cierre automático</Badge>
            </div>
          )}

          {/* B4: Countdown timer */}
          {proposal.status === 'active' && proposal.voting_end && (
            <CountdownTimer endDate={proposal.voting_end} />
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {canActivate && isAdmin && (
              <Button onClick={handleActivate} disabled={updateStatus.isPending}>
                Abrir Votación
              </Button>
            )}
            {canClose && isAdmin && (
              <Button variant="outline" onClick={handleClose} disabled={closeProposalMut.isPending}>
                Cerrar Votación
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <QuorumIndicator voteSummary={voteSummary} quorumRequired={proposal.quorum_required} />

      {currentMember && (
        <VotingPanel
          proposalId={proposalId}
          memberId={currentMember.id}
          voteSummary={voteSummary}
          existingVotes={votes ?? []}
          disabled={!isVotingOpen}
        />
      )}

      {/* B3: Delegation info */}
      {currentMember && proposal.status === 'active' && (
        <DelegationManager memberId={currentMember.id} />
      )}

      {/* B6: Manual execution of financial proposals */}
      {proposal.status === 'approved' && proposal.financial_instruction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instrucción Financiera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              {(() => {
                const fi = proposal.financial_instruction as any
                const typeLabels: Record<string, string> = {
                  disbursement: 'Desembolso',
                  budget_allocation: 'Asignación Presupuestal',
                  quota_change: 'Cambio de Cuota',
                  config_change: 'Cambio de Configuración',
                  none: 'Sin instrucción',
                }
                return (
                  <>
                    <p><strong>Tipo:</strong> {typeLabels[fi.type] || fi.type}</p>
                    {fi.amount != null && <p><strong>Monto:</strong> ${Number(fi.amount).toLocaleString('es-MX')}</p>}
                    {fi.new_amount != null && <p><strong>Nuevo monto:</strong> ${Number(fi.new_amount).toLocaleString('es-MX')}</p>}
                    {fi.description && <p><strong>Descripción:</strong> {fi.description}</p>}
                    {fi.period && <p><strong>Periodo:</strong> {fi.period}</p>}
                    {fi.effective_date && <p><strong>Fecha efectiva:</strong> {fi.effective_date}</p>}
                    {fi.recipient_name && <p><strong>Beneficiario:</strong> {fi.recipient_name}</p>}
                    {fi.config_key && <p><strong>Configuración:</strong> {fi.config_key} = {JSON.stringify(fi.config_value)}</p>}
                  </>
                )
              })()}
            </div>

            {proposal.execution_status === 'executed' ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Ejecutada el {proposal.executed_at ? formatDate(proposal.executed_at) : ''}
                </span>
              </div>
            ) : proposal.execution_status === 'cool_down' && proposal.cool_down_until ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  <Timer className="h-4 w-4" />
                  {new Date(proposal.cool_down_until) > new Date() ? (
                    <span>Periodo de enfriamiento — se auto-ejecutará el {formatDateTime(proposal.cool_down_until)}</span>
                  ) : (
                    <span>Periodo de enfriamiento completado — lista para ejecutar</span>
                  )}
                </div>
                {isAdmin && new Date(proposal.cool_down_until) <= new Date() && (
                  <Button
                    onClick={() => user && executeMut.mutate(
                      { proposalId, userId: user.id },
                      {
                        onSuccess: () => { toast.success('Propuesta ejecutada'); refetchProposal() },
                        onError: (err: any) => toast.error(err?.message || 'Error al ejecutar'),
                      }
                    )}
                    disabled={executeMut.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {executeMut.isPending ? 'Ejecutando...' : 'Ejecutar Ahora'}
                  </Button>
                )}
              </div>
            ) : proposal.execution_status === 'failed' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>La ejecución falló — puedes reintentar</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => user && executeMut.mutate(
                      { proposalId, userId: user.id },
                      {
                        onSuccess: () => { toast.success('Propuesta ejecutada'); refetchProposal() },
                        onError: (err: any) => toast.error(err?.message || 'Error al ejecutar'),
                      }
                    )}
                    disabled={executeMut.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {executeMut.isPending ? 'Reintentando...' : 'Reintentar Ejecución'}
                  </Button>
                )}
              </div>
            ) : (
              isAdmin && (
                <Button
                  onClick={() => user && executeMut.mutate(
                    { proposalId, userId: user.id },
                    {
                      onSuccess: () => { toast.success('Propuesta ejecutada'); refetchProposal() },
                      onError: (err: any) => toast.error(err?.message || 'Error al ejecutar'),
                    }
                  )}
                  disabled={executeMut.isPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {executeMut.isPending ? 'Ejecutando...' : 'Ejecutar Manualmente'}
                </Button>
              )
            )}

            {executeMut.isError && (
              <p className="text-sm text-destructive">{(executeMut.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <MinutesGenerator proposal={proposal} voteSummary={voteSummary} />
      )}
    </div>
  )
}
