import { useImportJobs, useRollbackImportJob } from '../hooks/useImportJobs'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatDateTime } from '@/shared/lib/utils'
import { usePermissions } from '@/shared/hooks/usePermissions'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Error',
  rolled_back: 'Revertido',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
  pending: 'default',
  processing: 'warning',
  completed: 'success',
  failed: 'destructive',
  rolled_back: 'warning',
}

export function ImportHistory() {
  const { data: jobs, isLoading } = useImportJobs()
  const rollbackMutation = useRollbackImportJob()
  const { canManageTreasury, isAdmin } = usePermissions()

  if (isLoading) return <LoadingSpinner message="Cargando historial..." className="py-8" />

  if (!jobs || jobs.length === 0) {
    return <p className="text-muted-foreground">No hay importaciones previas.</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fuente</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Importados</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Omitidos</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Total</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.source_name || '—'}</TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {job.started_at ? formatDateTime(job.started_at) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[job.status] || 'default'}>
                  {STATUS_LABELS[job.status] || job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{job.rows_imported}</TableCell>
              <TableCell className="hidden sm:table-cell text-right">{job.rows_skipped}</TableCell>
              <TableCell className="hidden sm:table-cell text-right">{job.rows_total}</TableCell>
              <TableCell>
                {job.status === 'completed' && (canManageTreasury || isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={rollbackMutation.isPending}
                    onClick={() => rollbackMutation.mutate(job.id)}
                  >
                    Deshacer
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
