import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import type { Vote, VotingOption } from '../types'
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  proposalId: string
  memberId: string
  options: VotingOption[]
  existingVotes: Vote[]
  disabled: boolean
  onVote: (value: string) => void
  isPending: boolean
}

export function MultipleChoiceVotingPanel({
  proposalId: _proposalId,
  memberId,
  options,
  existingVotes,
  disabled,
  onVote,
  isPending,
}: Props) {
  const { t } = useI18n()
  const myVote = existingVotes.find((v) => v.member_id === memberId && !v.delegated_from)
  const [selected, setSelected] = useState<string | null>(myVote?.value ?? null)

  // Count votes per option
  const voteCounts: Record<string, number> = {}
  let totalWeight = 0
  for (const v of existingVotes) {
    voteCounts[v.value] = (voteCounts[v.value] ?? 0) + v.weight
    totalWeight += v.weight
  }

  const handleSelect = (optionValue: string) => {
    if (disabled || isPending) return
    setSelected(optionValue)
    onVote(optionValue)
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('multipleChoice.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* My vote status */}
        {myVote && (
          <div className="rounded-md bg-muted p-2 text-sm">
            {t('multipleChoice.myVote')} <strong>{
              options.find((opt) => opt.id === myVote.value)?.label
              ?? options.find((_, i) => `option_${i + 1}` === myVote.value)?.label
              ?? myVote.value
            }</strong>
          </div>
        )}

        {/* Options as radio-style buttons + results bar */}
        <div className="space-y-2">
          {options.map((option, idx) => {
            const optionValue = option.id || `option_${idx + 1}`
            const legacyValue = `option_${idx + 1}`
            const count = (voteCounts[optionValue] ?? 0) + (legacyValue !== optionValue ? (voteCounts[legacyValue] ?? 0) : 0)
            const pct = totalWeight > 0 ? (count / totalWeight) * 100 : 0
            const isSelected =
              selected === optionValue ||
              selected === legacyValue ||
              myVote?.value === optionValue ||
              myVote?.value === legacyValue

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(optionValue)}
                disabled={disabled || isPending}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all overflow-hidden',
                  isSelected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-muted hover:border-muted-foreground/30',
                  (disabled || isPending) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Background bar */}
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 transition-all duration-500',
                    isSelected ? 'bg-primary/10' : 'bg-muted/50'
                  )}
                  style={{ width: `${pct}%` }}
                />

                {/* Content */}
                <div className="relative flex flex-1 items-center gap-2">
                  <div className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'
                  )}>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>

                {/* Vote count */}
                <div className="relative text-right">
                  <span className="text-sm font-bold">{pct.toFixed(0)}%</span>
                  <p className="text-[10px] text-muted-foreground">{t('multipleChoice.votesCount').replace('{count}', String(count))}</p>
                </div>
              </button>
            )
          })}
        </div>

        {totalWeight > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {t('multipleChoice.totalVotes').replace('{count}', String(totalWeight))}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
