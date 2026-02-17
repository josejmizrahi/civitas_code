import { useCastVoteWithDelegations } from '../hooks/useVoting'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { useToast } from '@/shared/components/ui/toast'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { VoteSummary, Vote } from '../types'
import { ThumbsUp, ThumbsDown, MinusCircle, AlertTriangle } from 'lucide-react'

interface Props {
  proposalId: string
  memberId: string
  voteSummary: VoteSummary | undefined
  existingVotes: Vote[]
  disabled?: boolean
}

export function VotingPanel({ proposalId, memberId, voteSummary, existingVotes, disabled }: Props) {
  const castVote = useCastVoteWithDelegations()
  const { canVote } = useRulesEngine()
  const toast = useToast()
  const myVote = existingVotes.find((v) => v.member_id === memberId)

  const handleVote = (value: string) => {
    castVote.mutate({ proposalId, memberId, value }, {
      onSuccess: () => toast.success('Voto registrado'),
      onError: () => toast.error('Error al registrar voto'),
    })
  }

  const votingDisabled = disabled || !canVote.allowed

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tu Voto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canVote.allowed && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{canVote.reason}</p>
          </div>
        )}

        {myVote ? (
          <p className="text-sm text-muted-foreground">
            Ya votaste: <strong>{myVote.value === 'yes' ? 'A favor' : myVote.value === 'no' ? 'En contra' : 'Abstención'}</strong>.
            Puedes cambiar tu voto.
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button
            variant={myVote?.value === 'yes' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('yes')}
            disabled={votingDisabled || castVote.isPending}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            A favor
          </Button>
          <Button
            variant={myVote?.value === 'no' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('no')}
            disabled={votingDisabled || castVote.isPending}
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            En contra
          </Button>
          <Button
            variant={myVote?.value === 'abstain' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('abstain')}
            disabled={votingDisabled || castVote.isPending}
          >
            <MinusCircle className="mr-2 h-4 w-4" />
            Abstención
          </Button>
        </div>

        {voteSummary && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-green-50 p-2">
              <div className="text-lg font-bold text-green-600">{voteSummary.yes}</div>
              <div className="text-xs text-muted-foreground">A favor</div>
            </div>
            <div className="rounded-md bg-red-50 p-2">
              <div className="text-lg font-bold text-red-600">{voteSummary.no}</div>
              <div className="text-xs text-muted-foreground">En contra</div>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <div className="text-lg font-bold text-gray-600">{voteSummary.abstain}</div>
              <div className="text-xs text-muted-foreground">Abstención</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
