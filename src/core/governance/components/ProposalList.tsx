import { useProposals } from '../hooks/useProposals'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatDate } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'
import { EndorsementBar } from './EndorsementBar'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  discussion: 'En Discusión',
  active: 'Activa',
  closed: 'Cerrada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  executed: 'Ejecutada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  discussion: 'secondary',
  active: 'warning',
  closed: 'default',
  approved: 'success',
  rejected: 'destructive',
  executed: 'success',
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria',
  extraordinary: 'Extraordinaria',
  budget: 'Presupuesto',
  election: 'Elección',
  amendment: 'Enmienda',
}

interface Props {
  statusFilter?: string
}

export function ProposalList({ statusFilter }: Props) {
  const { data: proposals, isLoading } = useProposals(statusFilter)

  if (isLoading) return <LoadingSpinner message="Cargando propuestas..." className="py-8" />

  if (!proposals || proposals.length === 0) {
    return <p className="text-muted-foreground">No hay propuestas.</p>
  }

  return (
    <div className="grid gap-4">
      {proposals.map((p) => (
        <Link key={p.id} to={`/governance/${p.id}`} className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[p.type] || p.type}</Badge>
                  <Badge variant={STATUS_VARIANTS[p.status] || 'default'}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              {p.status === 'draft' && p.endorsements_required > 0 && (
                <div className="mb-2" onClick={(e) => e.preventDefault()}>
                  <EndorsementBar proposal={p} />
                </div>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Creada: {formatDate(p.created_at)}</span>
                {p.voting_start && <span>Votación: {formatDate(p.voting_start)}</span>}
                {p.voting_end && <span>Cierre: {formatDate(p.voting_end)}</span>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
