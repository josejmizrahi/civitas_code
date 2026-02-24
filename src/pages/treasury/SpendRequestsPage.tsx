import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { useSpendRequests } from '@/core/treasury/hooks/useSpendRequests'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { formatCurrency } from '@/shared/lib/utils'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { PageHeader } from '@/shared/components/ui/page-header'
import type { SpendRequestStatus } from '@/core/treasury/types'

const STATUS_LABELS: Record<SpendRequestStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente aprobación',
  pending_vote: 'Pendiente votación',
  approved: 'Aprobado',
  executing: 'Ejecutando',
  executed: 'Ejecutado',
  verified: 'Verificado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'N1 Presupuesto',
  2: 'N2 Discrecional',
  3: 'N3 Votación',
  4: 'N4 Emergencia',
}

export function SpendRequestsPage() {
  const navigate = useNavigate()
  const { canManageTreasury } = usePermissions()
  const [statusFilter, setStatusFilter] = useState<SpendRequestStatus | 'all'>('all')

  const filters =
    statusFilter === 'all'
      ? undefined
      : { status: statusFilter }
  const { data: requests, isLoading } = useSpendRequests(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes de gasto"
        subtitle="Ciclo de vida de egresos: borrador → clasificación → aprobación/ejecución."
        actions={
          canManageTreasury ? (
            <Button onClick={() => navigate('/treasury/requests/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva solicitud
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SpendRequestStatus | 'all')}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">Todos</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !requests?.length ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center text-muted-foreground">
          <FileText className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-2">No hay solicitudes de gasto.</p>
          {canManageTreasury && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/treasury/requests/new')}
            >
              Crear la primera
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((sr) => (
                <TableRow
                  key={sr.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/treasury/requests/${sr.id}`)}
                >
                  <TableCell className="font-medium">{sr.title}</TableCell>
                  <TableCell>{formatCurrency(sr.amount)}</TableCell>
                  <TableCell>{sr.category_name ?? sr.category_id}</TableCell>
                  <TableCell>
                    {sr.authorization_level != null ? (
                      <Badge variant="secondary">{LEVEL_LABELS[sr.authorization_level] ?? `N${sr.authorization_level}`}</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sr.status === 'rejected' || sr.status === 'cancelled' ? 'destructive' : 'default'}>
                      {STATUS_LABELS[sr.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/treasury/requests/${sr.id}`)
                      }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
