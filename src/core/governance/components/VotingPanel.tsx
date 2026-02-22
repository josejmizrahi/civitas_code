import { useCastVoteWithDelegations } from '../hooks/useVoting'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { useToast } from '@/shared/components/ui/toast'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import type { VoteSummary, Vote } from '../types'
import { ThumbsUp, ThumbsDown, MinusCircle, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  proposalId: string
  memberId: string
  voteSummary: VoteSummary | undefined
  existingVotes: Vote[]
  disabled?: boolean
}

export function VotingPanel({ proposalId, memberId, voteSummary, existingVotes, disabled }: Props) {
  const { t } = useI18n()
  const castVote = useCastVoteWithDelegations()
  const { canVote } = useRulesEngine()
  const toast = useToast()
  const myVote = existingVotes.find((v) => v.member_id === memberId && !v.delegated_from)

  const handleVote = (value: string) => {
    castVote.mutate({ proposalId, memberId, value }, {
      onSuccess: () => toast.success(t('votingPanel.toast.success')),
      onError: () => toast.error(t('votingPanel.toast.error')),
    })
  }

  const votingDisabled = disabled || !canVote.allowed

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('votingPanel.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canVote.allowed && (
          <div className={cn(
            "flex items-start gap-2 rounded-md p-3",
            canVote.reason?.includes('moroso')
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4 mt-0.5 shrink-0",
              canVote.reason?.includes('moroso') ? "text-red-600" : "text-amber-600"
            )} />
            <div>
              <p className={cn(
                "text-sm",
                canVote.reason?.includes('moroso') ? "text-red-800" : "text-amber-800"
              )}>{canVote.reason}</p>
              {canVote.reason?.includes('moroso') && (
                <p className="text-xs text-red-600 mt-1">{t('votingPanel.voiceOnly')}</p>
              )}
            </div>
          </div>
        )}

        {myVote ? (
          <p className="text-sm text-muted-foreground">
            {t('votingPanel.alreadyVoted')} <strong>{myVote.value === 'yes' ? t('votingPanel.yes') : myVote.value === 'no' ? t('votingPanel.no') : t('votingPanel.abstain')}</strong>. {t('votingPanel.canChange')}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant={myVote?.value === 'yes' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('yes')}
            disabled={votingDisabled || castVote.isPending}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {t('votingPanel.yes')}
          </Button>
          <Button
            variant={myVote?.value === 'no' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('no')}
            disabled={votingDisabled || castVote.isPending}
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            {t('votingPanel.no')}
          </Button>
          <Button
            variant={myVote?.value === 'abstain' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleVote('abstain')}
            disabled={votingDisabled || castVote.isPending}
          >
            <MinusCircle className="mr-2 h-4 w-4" />
            {t('votingPanel.abstain')}
          </Button>
        </div>

        {voteSummary && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-green-50 p-2">
              <div className="text-lg font-bold text-green-600">{voteSummary.yes}</div>
              <div className="text-xs text-muted-foreground">{t('votingPanel.yes')}</div>
            </div>
            <div className="rounded-md bg-red-50 p-2">
              <div className="text-lg font-bold text-red-600">{voteSummary.no}</div>
              <div className="text-xs text-muted-foreground">{t('votingPanel.no')}</div>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <div className="text-lg font-bold text-gray-600">{voteSummary.abstain}</div>
              <div className="text-xs text-muted-foreground">{t('votingPanel.abstain')}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
