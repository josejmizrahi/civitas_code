import { Progress } from '@/shared/components/ui/progress'
import type { VoteSummary } from '../types'

interface Props {
  voteSummary: VoteSummary | undefined
  quorumRequired: number
}

export function QuorumIndicator({ voteSummary, quorumRequired }: Props) {
  if (!voteSummary) return null

  const pct = voteSummary.participation_pct * 100
  const requiredPct = quorumRequired * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Participación</span>
        <span className="font-medium">
          {pct.toFixed(1)}% / {requiredPct.toFixed(0)}% requerido
        </span>
      </div>
      <Progress value={pct} max={100} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{voteSummary.total} votos emitidos</span>
        {voteSummary.quorum_met ? (
          <span className="font-medium text-green-600">Quórum alcanzado</span>
        ) : (
          <span className="font-medium text-yellow-600">Quórum pendiente</span>
        )}
      </div>
    </div>
  )
}
