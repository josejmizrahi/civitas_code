import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { ThumbsUp, ThumbsDown, Minus, ShieldAlert } from 'lucide-react'
import type { Vote, VoteSummary } from '../types'

interface Props {
  proposalId: string
  memberId: string
  existingVotes: Vote[]
  voteSummary: VoteSummary | undefined
  disabled: boolean
  onVote: (value: string, blockReason?: string) => void
  isPending: boolean
}

const CONSENSUS_OPTIONS = [
  { value: 'agree', label: 'De acuerdo', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { value: 'disagree', label: 'En desacuerdo', icon: ThumbsDown, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'abstain', label: 'Abstención', icon: Minus, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200 hover:bg-gray-100' },
  { value: 'block', label: 'Bloquear', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 border-red-200 hover:bg-red-100' },
] as const

export function ConsensusVotingPanel({
  proposalId,
  memberId,
  existingVotes,
  voteSummary,
  disabled,
  onVote,
  isPending,
}: Props) {
  const [blockReason, setBlockReason] = useState('')
  const [showBlockReason, setShowBlockReason] = useState(false)

  const myVote = existingVotes.find((v) => v.member_id === memberId && !v.delegated_from)
  const hasBlocks = existingVotes.some((v) => v.value === 'block')

  const handleVote = (value: string) => {
    if (value === 'block') {
      setShowBlockReason(true)
      return
    }
    onVote(value)
  }

  const handleBlock = () => {
    if (!blockReason.trim()) return
    onVote('block', blockReason.trim())
    setShowBlockReason(false)
    setBlockReason('')
  }

  // Count votes by type
  const agreeCt = existingVotes.filter((v) => v.value === 'agree').reduce((s, v) => s + v.weight, 0)
  const disagreeCt = existingVotes.filter((v) => v.value === 'disagree').reduce((s, v) => s + v.weight, 0)
  const abstainCt = existingVotes.filter((v) => v.value === 'abstain').reduce((s, v) => s + v.weight, 0)
  const blockCt = existingVotes.filter((v) => v.value === 'block').reduce((s, v) => s + v.weight, 0)
  const totalWeight = agreeCt + disagreeCt + abstainCt + blockCt

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Votación por Consenso</span>
          {hasBlocks && (
            <Badge variant="destructive" className="text-xs">
              <ShieldAlert className="mr-1 h-3 w-3" />
              Bloqueada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My vote status */}
        {myVote && (
          <div className="rounded-md bg-muted p-2 text-sm">
            Tu voto: <strong>{CONSENSUS_OPTIONS.find((o) => o.value === myVote.value)?.label ?? myVote.value}</strong>
            {myVote.value === 'block' && myVote.block_reason && (
              <p className="mt-1 text-xs text-muted-foreground">Razón: {myVote.block_reason}</p>
            )}
          </div>
        )}

        {/* Voting buttons */}
        <div className="grid grid-cols-2 gap-2">
          {CONSENSUS_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isSelected = myVote?.value === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleVote(opt.value)}
                disabled={disabled || isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                  isSelected
                    ? `${opt.bg} ring-2 ring-current ${opt.color}`
                    : `border-muted hover:bg-muted/50`,
                  (disabled || isPending) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className={cn('h-5 w-5', opt.color)} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Block reason form */}
        {showBlockReason && (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">
              Bloquear detiene la propuesta. Explica tu razón:
            </p>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Razón del bloqueo (obligatorio)..."
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleBlock} disabled={!blockReason.trim() || isPending}>
                Confirmar Bloqueo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBlockReason(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Results bar */}
        {totalWeight > 0 && (
          <div className="space-y-2">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              {agreeCt > 0 && <div className="bg-green-500" style={{ width: `${(agreeCt / totalWeight) * 100}%` }} />}
              {disagreeCt > 0 && <div className="bg-amber-500" style={{ width: `${(disagreeCt / totalWeight) * 100}%` }} />}
              {abstainCt > 0 && <div className="bg-gray-400" style={{ width: `${(abstainCt / totalWeight) * 100}%` }} />}
              {blockCt > 0 && <div className="bg-red-500" style={{ width: `${(blockCt / totalWeight) * 100}%` }} />}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="text-green-600">Acuerdo: {agreeCt}</span>
              <span className="text-amber-600">Desacuerdo: {disagreeCt}</span>
              <span className="text-gray-500">Abstención: {abstainCt}</span>
              <span className="text-red-600">Bloqueo: {blockCt}</span>
            </div>
          </div>
        )}

        {/* Block reasons display */}
        {existingVotes.filter((v) => v.value === 'block' && v.block_reason).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-800">Razones de bloqueo:</p>
            {existingVotes.filter((v) => v.value === 'block' && v.block_reason).map((v) => (
              <div key={v.id} className="rounded bg-red-50 p-2 text-xs text-red-700">
                {v.block_reason}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
