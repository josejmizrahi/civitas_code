import { Link } from 'react-router-dom'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useLeaderboard } from '../hooks/useGamification'
import { DynamicIcon } from '@/shared/components/DynamicIcon'
import type { SocialNudge as SocialNudgeType } from '../types'

/**
 * Social Nudge -- peer proof.
 * Shows what other members are doing to encourage participation.
 */
export function SocialNudge() {
  const { data: proposals } = useProposals('active')
  const { data: members } = useMembers()
  const { data: obligations } = usePaymentObligations()
  const { data: leaderboard } = useLeaderboard(5)

  const nudges: SocialNudgeType[] = []

  // Payment nudge
  const totalMembers = members?.length ?? 0
  if (obligations) {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthObligations = obligations.filter((o) => o.due_date.startsWith(currentMonth))
    const paidCount = monthObligations.filter((o) => o.status === 'paid').length
    if (paidCount > 0 && paidCount < totalMembers) {
      nudges.push({
        type: 'payment',
        message: `${paidCount} vecino${paidCount > 1 ? 's' : ''} ya pagaron su cuota este mes`,
        icon: 'wallet',
        href: '/treasury',
      })
    } else if (paidCount === totalMembers && totalMembers > 0) {
      nudges.push({
        type: 'payment',
        message: 'Todos al corriente este mes',
        icon: 'check-circle',
      })
    }
  }

  // Voting nudge
  if (proposals && proposals.length > 0) {
    nudges.push({
      type: 'vote',
      message: `Hay ${proposals.length} propuesta${proposals.length > 1 ? 's' : ''} esperando votos`,
      icon: 'vote',
      href: '/governance',
    })
  }

  // Leaderboard nudge
  if (leaderboard && leaderboard.length >= 2) {
    const top = leaderboard[0]
    nudges.push({
      type: 'general',
      message: `${top.member_name.split(' ')[0]} lidera con ${top.xp} puntos`,
      icon: 'trophy',
    })
  }

  if (nudges.length === 0) return null

  return (
    <div className="space-y-1.5">
      {nudges.slice(0, 3).map((nudge, i) => {
        const content = (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm animate-slide-up-fade ${
              nudge.href ? 'hover:bg-accent/50 cursor-pointer transition-colors' : ''
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <DynamicIcon name={nudge.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{nudge.message}</span>
          </div>
        )

        return nudge.href ? (
          <Link key={i} to={nudge.href} className="block">{content}</Link>
        ) : (
          <div key={i}>{content}</div>
        )
      })}
    </div>
  )
}
