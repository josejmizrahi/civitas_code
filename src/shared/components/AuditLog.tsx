import { useState } from 'react'
import { useAuditLog } from '@/shared/hooks/useAuditLog'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { formatDateTime } from '@/shared/lib/utils'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó',
  update: 'Actualizó',
  delete: 'Eliminó',
  approve: 'Aprobó',
  close: 'Cerró',
  vote: 'Votó en',
  sign: 'Firmó',
  import: 'Importó',
  activate: 'Activó',
  deactivate: 'Desactivó',
}

const ENTITY_LABELS: Record<string, string> = {
  transaction: 'transacción',
  budget: 'presupuesto',
  proposal: 'propuesta',
  member: 'miembro',
  unit: 'unidad',
  minutes: 'acta',
  obligation: 'obligación',
  category: 'categoría',
  invitation: 'invitación',
  common_area: 'área común',
  maintenance: 'solicitud de mantenimiento',
}

interface Props {
  entityType?: string
  compact?: boolean
}

export function AuditLog({ entityType, compact }: Props) {
  const [page, setPage] = useState(0)
  const limit = compact ? 5 : PAGE_SIZE
  const { data: entries, isLoading } = useAuditLog({ limit: limit + 1, entityType, offset: page * limit })

  const hasMore = (entries?.length ?? 0) > limit
  const display = entries?.slice(0, limit) ?? []

  if (isLoading) return <LoadingSpinner message="Cargando actividad..." className="py-6" />
  if (display.length === 0) return <div className="text-muted-foreground text-sm">Sin actividad reciente.</div>

  const content = (
    <div className="space-y-3">
      {display.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 rounded-md border p-3">
          <Activity className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{ACTION_LABELS[entry.action] || entry.action}</span>{' '}
              <span className="text-muted-foreground">{ENTITY_LABELS[entry.entity_type] || entry.entity_type}</span>
              {entry.details?.description ? (
                <span className="text-muted-foreground"> — {String(entry.details.description)}</span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.created_at)}</p>
          </div>
          <Badge variant="default" className="text-xs shrink-0">
            {entry.entity_type}
          </Badge>
        </div>
      ))}
      {!compact && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">Página {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  if (compact) return content

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Registro de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
