import { useProposals } from '../hooks/useProposals'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatDate } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activa',
  closed: 'Cerrada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  active: 'warning',
  closed: 'default',
  approved: 'success',
  rejected: 'destructive',
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
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[p.type] || p.type}</Badge>
                  <Badge variant={STATUS_VARIANTS[p.status] || 'default'}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
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
