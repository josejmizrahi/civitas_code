import { useEffect, useRef, useState } from 'react'
import { useProposal, useUpdateProposalStatus, useStartDiscussion, useOpenVoting, useDeclareOutcome, useAppealProposal } from '../hooks/useProposals'
import { useVotes, useVoteSummary, useCloseProposal, useExecuteProposal, useCastVoteWithDelegations } from '../hooks/useVoting'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useAuth, useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { VotingPanel } from './VotingPanel'
import { ConsensusVotingPanel } from './ConsensusVotingPanel'
import { MultipleChoiceVotingPanel } from './MultipleChoiceVotingPanel'
import { VotingVisualization } from './VotingVisualization'
import { QuorumIndicator } from './QuorumIndicator'
import { MinutesGenerator } from './MinutesGenerator'
import { DelegationManager } from './DelegationManager'
import { EndorsementBar } from './EndorsementBar'
import { ProposalLifecycleIndicator } from './ProposalLifecycleIndicator'
import { DiscussionThread } from '@/core/deliberation/components/DiscussionThread'
import { ImplementationTracker } from '@/core/accountability/components/ImplementationTracker'
import { ProposalContextPanel } from './ProposalContextPanel'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatDate, formatDateTime } from '@/shared/lib/utils'
import {
  Clock,
  AlertTriangle,
  Play,
  CheckCircle2,
  Timer,
  XCircle,
  MessageSquare,
  Shield,
  Gavel,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { Link } from 'react-router-dom'

interface Props {
  proposalId: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  discussion: 'En Discusión',
  active: 'Votación Activa',
  closed: 'Cerrada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  executed: 'Ejecutada',
}

const STATUS_VARIANTS: Record<string, string> = {
  draft: 'default',
  discussion: 'secondary',
  active: 'default',
  closed: 'outline',
  approved: 'success',
  rejected: 'destructive',
  executed: 'success',
}

function CountdownTimer({ endDate, label }: { endDate: string; label?: string }) {
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
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${expired ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'}`}>
      {expired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      {expired ? `${label || 'Tiempo'} expirado` : `${label || 'Tiempo restante'}: ${timeLeft}`}
    </div>
  )
}

export function ProposalDetail({ proposalId }: Props) {
  const { user } = useAuth()
  const { communityId: _communityId } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const { rules } = useRulesEngine()
  const { data: proposal, isLoading, refetch: refetchProposal } = useProposal(proposalId)
  const { data: members } = useMembers()
  const { data: votes } = useVotes(proposalId)
  const updateStatus = useUpdateProposalStatus()
  const closeProposalMut = useCloseProposal()
  const executeMut = useExecuteProposal()
  const startDiscussionMut = useStartDiscussion()
  const openVotingMut = useOpenVoting()
  const declareOutcomeMut = useDeclareOutcome()
  const appealMut = useAppealProposal()
  const castVoteMut = useCastVoteWithDelegations()
  const toast = useToast()

  // Discussion hours input for starting discussion
  const [discussionHours, setDiscussionHours] = useState(
    String(rules.governance.default_discussion_hours)
  )
  // Voting end date for opening voting from discussion
  const [votingEndInput, setVotingEndInput] = useState('')
  // Outcome declaration text
  const [outcomeText, setOutcomeText] = useState('')
  const [showOutcomeForm, setShowOutcomeForm] = useState(false)

  const { data: voteSummary } = useVoteSummary(
    proposalId,
    proposal?.quorum_required ?? 0.5,
    proposal?.majority_required ?? 0.5
  )

  const currentMember = members?.find((m) => m.user_id === user?.id)

  // B4: Auto-close if voting_end has passed and proposal is still active
  const hasAutoClosedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!proposal || !user) return
    if (hasAutoClosedRef.current === proposalId) return
    if (proposal.status === 'active' && proposal.voting_end) {
      const end = new Date(proposal.voting_end).getTime()
      if (Date.now() > end) {
        hasAutoClosedRef.current = proposalId
        closeProposalMut.mutate(
          { proposalId, userId: user.id },
          { onSuccess: () => refetchProposal() }
        )
      }
    }
  }, [proposal?.status, proposal?.voting_end])

  if (isLoading) return <LoadingSpinner message="Cargando propuesta..." className="py-12" />
  if (!proposal) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Propuesta no encontrada o no tienes acceso.</p>
          <Link to="/governance">
            <Button variant="outline" size="sm">
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Volver a Gobernanza
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const endorsementsOk = proposal.endorsements_required === 0 || proposal.endorsements_met
  const canStartDiscussion = proposal.status === 'draft' && isAdmin && endorsementsOk
  
  const canClose = proposal.status === 'active'
  const isVotingOpen = proposal.status === 'active' &&
    (!proposal.voting_end || new Date(proposal.voting_end) > new Date())
  const isClosed = ['closed', 'approved', 'rejected', 'executed'].includes(proposal.status)

  // Discussion period expired check
  const discussionExpired = proposal.status === 'discussion' && proposal.discussion_end &&
    new Date(proposal.discussion_end) <= new Date()

  // Grace period check
  const hasGracePeriod = proposal.grace_period_end && new Date(proposal.grace_period_end) > new Date()
  const canAppeal = proposal.status === 'approved' && hasGracePeriod && !proposal.appealed && currentMember

  const handleStartDiscussion = () => {
    startDiscussionMut.mutate(
      { proposalId, discussionHours: parseInt(discussionHours) },
      {
        onSuccess: () => { toast.success('Periodo de discusión iniciado'); refetchProposal() },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al iniciar discusión'),
      }
    )
  }

  const handleOpenVoting = () => {
    if (proposal.status === 'discussion') {
      openVotingMut.mutate(
        { proposalId, votingEnd: votingEndInput || null },
        {
          onSuccess: () => { toast.success('Votación abierta'); refetchProposal() },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al abrir votación'),
        }
      )
    } else {
      updateStatus.mutate({ proposalId, status: 'active' }, {
        onSuccess: () => toast.success('Votación abierta'),
        onError: () => toast.error('Error al abrir votación'),
      })
    }
  }

  const handleClose = () => {
    if (!user) return
    closeProposalMut.mutate(
      { proposalId, userId: user.id },
      { onSuccess: () => refetchProposal() }
    )
  }

  const handleDeclareOutcome = () => {
    if (!user || !outcomeText.trim()) return
    declareOutcomeMut.mutate(
      { proposalId, outcome: outcomeText, userId: user.id },
      {
        onSuccess: () => {
          toast.success('Resultado declarado')
          setShowOutcomeForm(false)
          setOutcomeText('')
          refetchProposal()
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al declarar resultado'),
      }
    )
  }

  const handleAppeal = () => {
    if (!user) return
    appealMut.mutate(
      { proposalId, userId: user.id },
      {
        onSuccess: () => { toast.success('Propuesta apelada — ejecución pausada'); refetchProposal() },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al apelar'),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Lifecycle Indicator */}
      <ProposalLifecycleIndicator
        status={proposal.status}
        appealed={proposal.appealed}
        className="justify-center"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>{proposal.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {proposal.template_id && (
                <Badge variant="outline" className="text-[10px]">
                  {proposal.template_id}
                </Badge>
              )}
              {proposal.result && (
                <Badge variant="outline" className="text-xs">{proposal.result}</Badge>
              )}
              {proposal.appealed && (
                <Badge variant="destructive" className="text-xs">Apelada</Badge>
              )}
              <Badge variant={(STATUS_VARIANTS[proposal.status] || 'default') as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'}>
                {STATUS_LABELS[proposal.status] || proposal.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{proposal.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {proposal.creator_name && <span>Por: <span className="font-medium text-foreground">{proposal.creator_name}</span></span>}
            <span>Creada: {formatDate(proposal.created_at)}</span>
            {proposal.discussion_start && <span>Discusión: {formatDate(proposal.discussion_start)}</span>}
            {proposal.voting_start && <span>Inicio votación: {formatDate(proposal.voting_start)}</span>}
            {proposal.voting_end && <span>Cierre: {formatDate(proposal.voting_end)}</span>}
            <span>Quórum: {(proposal.quorum_required * 100).toFixed(0)}%</span>
            <span>Mayoría: {(proposal.majority_required * 100).toFixed(0)}%</span>
            {proposal.voting_model && proposal.voting_model !== 'simple' && (
              <Badge variant="outline" className="text-[10px]">
                {proposal.voting_model === 'consensus' ? 'Consenso' : proposal.voting_model === 'multiple_choice' ? 'Opción múltiple' : proposal.voting_model}
              </Badge>
            )}
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

          {/* Discussion countdown */}
          {proposal.status === 'discussion' && proposal.discussion_end && (
            <CountdownTimer endDate={proposal.discussion_end} label="Discusión" />
          )}

          {/* Voting countdown */}
          {proposal.status === 'active' && proposal.voting_end && (
            <CountdownTimer endDate={proposal.voting_end} label="Votación" />
          )}

          {/* Grace period countdown */}
          {proposal.status === 'approved' && proposal.grace_period_end && (
            <div className="space-y-2">
              <CountdownTimer endDate={proposal.grace_period_end} label="Periodo de apelación" />
              {proposal.appealed && (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <Shield className="h-4 w-4" />
                  <span>Esta propuesta fue apelada — la ejecución automática está pausada</span>
                </div>
              )}
            </div>
          )}

          {/* Endorsement bar for draft proposals */}
          {proposal.status === 'draft' && proposal.endorsements_required > 0 && (
            <EndorsementBar proposal={proposal} />
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Draft → Discussion */}
            {canStartDiscussion && proposal.discussion_min_hours && (
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Horas de discusión</Label>
                  <Input
                    type="number"
                    min="1"
                    max="720"
                    value={discussionHours}
                    onChange={(e) => setDiscussionHours(e.target.value)}
                    className="w-24 h-9"
                  />
                </div>
                <Button
                  onClick={handleStartDiscussion}
                  disabled={startDiscussionMut.isPending}
                  variant="secondary"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {startDiscussionMut.isPending ? 'Iniciando...' : 'Iniciar Discusión'}
                </Button>
              </div>
            )}

            {/* Discussion → Voting (only when discussion ended) */}
            {proposal.status === 'discussion' && isAdmin && discussionExpired && (
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Cierre de votación</Label>
                  <Input
                    type="datetime-local"
                    value={votingEndInput}
                    onChange={(e) => setVotingEndInput(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  onClick={handleOpenVoting}
                  disabled={openVotingMut.isPending}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {openVotingMut.isPending ? 'Abriendo...' : 'Abrir Votación'}
                </Button>
              </div>
            )}

            {/* Draft → Active (skip discussion) */}
            {proposal.status === 'draft' && isAdmin && endorsementsOk && (
              <Button onClick={handleOpenVoting} disabled={updateStatus.isPending}>
                Abrir Votación Directa
              </Button>
            )}

            {/* Close voting */}
            {canClose && isAdmin && (
              <Button variant="outline" onClick={handleClose} disabled={closeProposalMut.isPending}>
                Cerrar Votación
              </Button>
            )}

            {/* Appeal button — GV-043 */}
            {canAppeal && (
              <Button
                variant="outline"
                onClick={handleAppeal}
                disabled={appealMut.isPending}
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Shield className="mr-2 h-4 w-4" />
                {appealMut.isPending ? 'Apelando...' : 'Apelar Propuesta'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template-specific context panel — connects to Rules, Treasury, Identity */}
      <ProposalContextPanel proposal={proposal} />

      {/* Outcome Declaration — GV-001 */}
      {isClosed && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4" />
              Declaración de Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposal.outcome_declared ? (
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Resultado declarado:</p>
                  <p className="mt-1 whitespace-pre-wrap">{proposal.outcome_declared}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Declarado el {proposal.outcome_declared_at ? formatDateTime(proposal.outcome_declared_at) : ''}
                </p>
              </div>
            ) : showOutcomeForm ? (
              <div className="space-y-3">
                <Textarea
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="Describe el resultado oficial de esta propuesta..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeclareOutcome}
                    disabled={declareOutcomeMut.isPending || !outcomeText.trim()}
                    size="sm"
                  >
                    {declareOutcomeMut.isPending ? 'Declarando...' : 'Declarar Resultado'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowOutcomeForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowOutcomeForm(true)}>
                <Gavel className="mr-2 h-4 w-4" />
                Declarar Resultado
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discussion Thread — DL-001..DL-011 */}
      {(proposal.status === 'discussion' || proposal.status === 'active' || isClosed) && (
        <DiscussionThread
          proposalId={proposalId}
          canComment={proposal.status === 'discussion' || proposal.status === 'active'}
        />
      )}

      <QuorumIndicator voteSummary={voteSummary} quorumRequired={proposal.quorum_required} />

      {/* Voting Visualization — GV-017 */}
      {(votes ?? []).length > 0 && (
        <VotingVisualization
          votes={votes ?? []}
          voteSummary={voteSummary}
          votingModel={proposal.voting_model || 'simple'}
          votingOptions={proposal.voting_options}
        />
      )}

      {/* Voting Panel — conditional by model */}
      {currentMember && (() => {
        const votingModel = proposal.voting_model || 'simple'
        const handleVote = (value: string, blockReason?: string) => {
          castVoteMut.mutate(
            { proposalId, memberId: currentMember.id, value, blockReason },
            {
              onSuccess: () => toast.success('Voto registrado'),
              onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al registrar voto'),
            }
          )
        }

        if (votingModel === 'consensus') {
          return (
            <ConsensusVotingPanel
              proposalId={proposalId}
              memberId={currentMember.id}
              existingVotes={votes ?? []}
              voteSummary={voteSummary}
              disabled={!isVotingOpen}
              onVote={handleVote}
              isPending={castVoteMut.isPending}
            />
          )
        }

        if (votingModel === 'multiple_choice' && proposal.voting_options?.length > 0) {
          return (
            <MultipleChoiceVotingPanel
              proposalId={proposalId}
              memberId={currentMember.id}
              options={proposal.voting_options}
              existingVotes={votes ?? []}
              disabled={!isVotingOpen}
              onVote={handleVote}
              isPending={castVoteMut.isPending}
            />
          )
        }

        // Default: simple voting panel
        return (
          <VotingPanel
            proposalId={proposalId}
            memberId={currentMember.id}
            voteSummary={voteSummary}
            existingVotes={votes ?? []}
            disabled={!isVotingOpen}
          />
        )
      })()}

      {/* B3: Delegation info */}
      {currentMember && proposal.status === 'active' && (
        <DelegationManager memberId={currentMember.id} />
      )}

      {/* Implementation Tracker — AC-001..AC-005 */}
      {(proposal.status === 'approved' || proposal.status === 'executed') && (
        <ImplementationTracker proposalId={proposalId} />
      )}

      {/* B6: Manual execution of financial proposals */}
      {(proposal.status === 'approved' || proposal.status === 'executed') && proposal.financial_instruction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instrucción Financiera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              {(() => {
                const fi = proposal.financial_instruction
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

            {(proposal.execution_status === 'executed' || proposal.status === 'executed') ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Ejecutada el {proposal.executed_at ? formatDate(proposal.executed_at) : ''}
                </span>
              </div>
            ) : proposal.appealed ? (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                <Shield className="h-4 w-4" />
                <span>Ejecución pausada por apelación</span>
              </div>
            ) : proposal.execution_status === 'cool_down' && proposal.cool_down_until ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
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
                        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al ejecutar'),
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
                        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al ejecutar'),
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
              isAdmin && proposal.status === 'approved' && (
                <Button
                  onClick={() => user && executeMut.mutate(
                    { proposalId, userId: user.id },
                    {
                      onSuccess: () => { toast.success('Propuesta ejecutada'); refetchProposal() },
                      onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al ejecutar'),
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
