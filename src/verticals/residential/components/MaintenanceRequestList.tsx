import { useState } from 'react'
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useUpdateMaintenanceStatus, useAssignMaintenance } from '../hooks/useResidential'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Select } from '@/shared/components/ui/select'
import { formatDate } from '@/shared/lib/utils'
import type { MaintenanceStatus, MaintenancePriority } from '@/shared/types'

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En progreso',
  resolved: 'Resuelta',
  closed: 'Cerrada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const PRIORITY_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive',
}

const PRIORITY_ROW_COLORS: Record<string, string> = {
  low: '',
  medium: '',
  high: 'bg-yellow-50/50',
  urgent: 'bg-red-50/50',
}

const ALL_STATUSES: MaintenanceStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const ALL_PRIORITIES: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent']

export function MaintenanceRequestList() {
  const { data: requests, isLoading } = useMaintenanceRequests()
  const updateStatus = useUpdateMaintenanceStatus()
  const assignMaintenance = useAssignMaintenance()
  const { data: members } = useMembers()
  const { isAdmin } = usePermissions()

  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const activeMembers = (members ?? []).filter((m) => m.status === 'active')

  const filteredRequests = (requests ?? []).filter((req) =>
    priorityFilter === 'all' ? true : req.priority === priorityFilter,
  )

  const handleStatusChange = (requestId: string, status: MaintenanceStatus) => {
    updateStatus.mutate({ requestId, status })
  }

  const handleAssignChange = (requestId: string, memberId: string) => {
    assignMaintenance.mutate({
      requestId,
      memberId: memberId || null,
    })
  }

  if (isLoading) return <LoadingSpinner message="Cargando solicitudes..." className="py-8" />

  if (!requests || requests.length === 0) {
    return <p className="text-muted-foreground">No hay solicitudes de mantenimiento.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por prioridad:</span>
        <Select
          className="w-40"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead>Asignado a</TableHead>}
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req) => (
              <TableRow key={req.id} className={PRIORITY_ROW_COLORS[req.priority] ?? ''}>
                <TableCell className="font-medium">{req.unit_number || '\u2014'}</TableCell>
                <TableCell className="max-w-64 truncate">{req.description}</TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANTS[req.priority] || 'default'}>
                    {PRIORITY_LABELS[req.priority] || req.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select
                      className="w-32"
                      value={req.status}
                      onChange={(e) =>
                        handleStatusChange(req.id, e.target.value as MaintenanceStatus)
                      }
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </Select>
                  ) : (
                    <Badge variant={STATUS_VARIANTS[req.status] || 'default'}>
                      {STATUS_LABELS[req.status] || req.status}
                    </Badge>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Select
                      className="w-40"
                      value={req.assigned_to ?? ''}
                      onChange={(e) => handleAssignChange(req.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {activeMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name || m.email || m.id.slice(0, 8)}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{formatDate(req.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRequests.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No hay solicitudes con la prioridad seleccionada.
        </p>
      )}
    </div>
  )
}
