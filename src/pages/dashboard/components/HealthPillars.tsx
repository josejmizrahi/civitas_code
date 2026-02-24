import { Progress } from '@/shared/components/ui/progress'
import { Users, Wallet, Vote } from 'lucide-react'

interface HealthPillarsProps {
  identity: number
  treasury: number
  governance: number
  memberLabel: string
}

export function HealthPillars({ identity, treasury, governance, memberLabel }: HealthPillarsProps) {
  const pillars = [
    { icon: Users, color: 'text-violet-500', label: memberLabel, value: identity },
    { icon: Wallet, color: 'text-emerald-500', label: 'Hacienda', value: treasury },
    { icon: Vote, color: 'text-blue-500', label: 'Gobierno', value: governance },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {pillars.map((p) => (
        <div key={p.label} className="rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
            <span className="text-xs font-medium">{p.label}</span>
            <span className="ml-auto text-xs font-bold">{p.value}%</span>
          </div>
          <Progress value={p.value} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}
