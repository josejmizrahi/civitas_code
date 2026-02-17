import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/utils'
import { CheckCircle } from 'lucide-react'
import type { GovernanceRules } from '@/shared/types/rules'

interface Props {
  currentCall: number
  currentPct: number
  governanceRules: GovernanceRules
  assemblyType: string
}

interface TierConfig {
  label: string
  threshold: number
  callNumber: number
}

export function QuorumTierIndicator({
  currentCall,
  currentPct,
  governanceRules,
  assemblyType,
}: Props) {
  const isExtraordinary = assemblyType === 'extraordinary'

  const tiers: TierConfig[] = isExtraordinary
    ? [
        {
          label: 'Quorum Extraordinario',
          threshold: governanceRules.extraordinary_quorum,
          callNumber: 1,
        },
      ]
    : [
        {
          label: '1a Llamada',
          threshold: governanceRules.quorum_first_call,
          callNumber: 1,
        },
        {
          label: '2a Llamada',
          threshold: governanceRules.quorum_second_call,
          callNumber: 2,
        },
        {
          label: '3a Llamada',
          threshold: governanceRules.quorum_third_call,
          callNumber: 3,
        },
      ]

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Sistema de Quorum (Art. 33 LPCI)</h4>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const isCurrent = tier.callNumber === currentCall
          const isPast = tier.callNumber < currentCall
          const met = currentPct >= tier.threshold
          const pctDisplay = (currentPct * 100).toFixed(1)
          const thresholdDisplay =
            tier.threshold === 0
              ? 'Quienes asistan'
              : `${(tier.threshold * 100).toFixed(1)}%`

          return (
            <div
              key={tier.callNumber}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                isCurrent && 'border-primary bg-primary/5',
                isPast && 'opacity-60',
                !isCurrent && !isPast && 'opacity-80'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary'
                    )}
                  >
                    {tier.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                      Actual
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {thresholdDisplay}
                  </span>
                  {isCurrent && met && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>

              {isCurrent && (
                <>
                  <Progress
                    value={currentPct * 100}
                    max={tier.threshold === 0 ? 100 : tier.threshold * 100}
                    className={cn(
                      'h-3',
                      met && '[&>div]:bg-green-500'
                    )}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Asistencia: {pctDisplay}%</span>
                    {met ? (
                      <span className="font-medium text-green-600">
                        Quorum alcanzado
                      </span>
                    ) : (
                      <span className="font-medium text-yellow-600">
                        Quorum pendiente
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
