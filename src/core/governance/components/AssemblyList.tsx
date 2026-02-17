import { useAssemblies } from '../hooks/useAssemblies'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatDateTime } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada',
  convened: 'Convocada',
  in_session: 'En sesion',
  first_call: '1a Llamada',
  second_call: '2a Llamada',
  third_call: '3a Llamada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  scheduled: 'secondary',
  convened: 'warning',
  in_session: 'default',
  first_call: 'warning',
  second_call: 'warning',
  third_call: 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria',
  extraordinary: 'Extraordinaria',
}

const TYPE_VARIANTS: Record<string, 'default' | 'secondary'> = {
  ordinary: 'secondary',
  extraordinary: 'default',
}

interface Props {
  statusFilter?: string
}

export function AssemblyList({ statusFilter }: Props) {
  const { data: assemblies, isLoading } = useAssemblies(statusFilter)

  if (isLoading) return <LoadingSpinner message="Cargando asambleas..." className="py-8" />

  if (!assemblies || assemblies.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No hay asambleas registradas.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {assemblies.map((a) => {
        const presentCount = (a.attendance || []).filter((r) => r.present).length
        const totalCount = (a.attendance || []).length

        return (
          <Link key={a.id} to={`/governance/assemblies/${a.id}`} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={TYPE_VARIANTS[a.type] || 'secondary'}>
                      {TYPE_LABELS[a.type] || a.type}
                    </Badge>
                    <Badge variant={STATUS_VARIANTS[a.status] || 'default'}>
                      {STATUS_LABELS[a.status] || a.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(a.scheduled_date)}
                  </span>
                  {a.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {a.location}
                    </span>
                  )}
                  {totalCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {presentCount}/{totalCount} presentes
                    </span>
                  )}
                  {a.quorum_met && (
                    <Badge variant="success" className="text-xs">Quorum alcanzado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
