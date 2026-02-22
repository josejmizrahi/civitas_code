import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { getCategories } from '@/core/treasury/services/treasury.service'
import { getRecurringSchedules } from '@/core/treasury/services/recurring.service'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { CheckCircle, Circle, Building2, Users, Wallet, Vote, Layers, ChevronRight } from 'lucide-react'

interface Step {
  id: string
  label: string
  description: string
  href: string
  done: boolean
  icon: typeof Users
}

export function FirstStepsChecklist() {
  const { communityId, community } = useCommunityContext()
  const { data: members } = useMembers()
  const { data: allProposals } = useProposals(undefined)
  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })
  const { data: recurringSchedules } = useQuery({
    queryKey: ['recurring-schedules', communityId],
    queryFn: () => getRecurringSchedules(communityId!),
    enabled: !!communityId,
  })
  const { data: units } = useQuery({
    queryKey: ['units', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id')
        .eq('community_id', communityId!)
      if (error) return []
      return data ?? []
    },
    enabled: !!communityId && community?.type === 'residential',
  })

  if (!communityId || !community) return null

  const steps: Step[] = [
    {
      id: 'invite',
      label: 'Invitar miembros',
      description: 'Envía invitaciones por correo',
      href: '/members',
      done: (members?.length ?? 0) > 1,
      icon: Users,
    },
    {
      id: 'categories',
      label: 'Verificar categorías financieras',
      description: 'Ajusta ingresos y egresos',
      href: '/settings',
      done: (categories?.length ?? 0) > 0,
      icon: Layers,
    },
    {
      id: 'recurring',
      label: 'Crear primer cobro recurrente',
      description: 'Define cuotas periódicas',
      href: '/treasury',
      done: (recurringSchedules?.length ?? 0) > 0,
      icon: Wallet,
    },
    {
      id: 'proposal',
      label: 'Crear primera propuesta',
      description: 'Pon algo a votación',
      href: '/governance',
      done: (allProposals?.length ?? 0) > 0,
      icon: Vote,
    },
  ]

  if (community.type === 'residential') {
    steps.push({
      id: 'units',
      label: 'Registrar unidades',
      description: 'Alta de departamentos o casas',
      href: '/residential',
      done: (units?.length ?? 0) > 0,
      icon: Building2,
    })
  }

  const allDone = steps.every((s) => s.done)
  if (allDone) return null

  const doneCount = steps.filter((s) => s.done).length

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Primeros pasos</CardTitle>
        <CardDescription>
          {doneCount} de {steps.length} completados — configura tu comunidad para sacarle el máximo provecho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Link
              key={step.id}
              to={step.href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              {step.done ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className={step.done ? 'text-muted-foreground line-through text-sm' : 'font-medium text-sm'}>
                  {step.label}
                </span>
                {!step.done && (
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                )}
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
