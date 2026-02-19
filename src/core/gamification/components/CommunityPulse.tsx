import { useMembers } from '@/core/identity/hooks/useMembers'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { useLeaderboard } from '../hooks/useGamification'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

/**
 * Community Pulse — collective health meter.
 * Shows how healthy the community is based on payments, participation, and activity.
 * When you contribute, the pulse goes up → "Gracias a ti, subimos".
 */
export function CommunityPulse() {
  const { data: members } = useMembers()
  const { data: obligations } = usePaymentObligations()
  const { data: proposals } = useProposals('active')
  const { data: leaderboard } = useLeaderboard(100)

  // Calculate payment health
  const totalObligations = obligations?.length ?? 0
  const paidObligations = obligations?.filter((o) => o.status === 'paid').length ?? 0
  const paymentPct = totalObligations > 0 ? Math.round((paidObligations / totalObligations) * 100) : 100

  // Calculate participation (members with recent activity via leaderboard)
  const totalMembers = members?.length ?? 1
  const activeMembers = leaderboard?.filter((e) => e.current_streak > 0).length ?? 0
  const participationPct = Math.round((activeMembers / totalMembers) * 100)

  // Calculate activity (proposals getting votes)
  const activeProposals = proposals?.length ?? 0
  const activityPct = activeProposals > 0 ? Math.min(100, 50 + activeProposals * 10) : 30

  // Overall score (weighted)
  const overall = Math.round(paymentPct * 0.5 + participationPct * 0.3 + activityPct * 0.2)

  const pulseColor = overall >= 80 ? 'text-green-600' : overall >= 50 ? 'text-yellow-600' : 'text-red-600'
  const pulseBg = overall >= 80 ? 'bg-green-500' : overall >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const pulseLabel = overall >= 80 ? '¡Excelente!' : overall >= 50 ? 'Puede mejorar' : 'Necesita atención'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          💓 Pulso de la Comunidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big overall score */}
        <div className="text-center">
          <div className={`text-4xl font-black ${pulseColor}`}>{overall}%</div>
          <p className="text-sm text-muted-foreground">{pulseLabel}</p>
        </div>

        {/* Overall bar */}
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${pulseBg}`}
            style={{ width: `${overall}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <PulseMetric
            icon="💰"
            label="Pagos al corriente"
            value={paymentPct}
            detail={`${paidObligations} de ${totalObligations} pagados`}
          />
          <PulseMetric
            icon="👥"
            label="Vecinos activos"
            value={participationPct}
            detail={`${activeMembers} de ${totalMembers} participando`}
          />
          <PulseMetric
            icon="🗳️"
            label="Actividad"
            value={activityPct}
            detail={activeProposals > 0 ? `${activeProposals} propuesta${activeProposals > 1 ? 's' : ''} activa${activeProposals > 1 ? 's' : ''}` : 'Sin propuestas activas'}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function PulseMetric({ icon, label, value, detail }: {
  icon: string
  label: string
  value: number
  detail: string
}) {
  const barColor = value >= 80 ? 'bg-green-400' : value >= 50 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-muted-foreground">{label}</span>
        </span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  )
}
