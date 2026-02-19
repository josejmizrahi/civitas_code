import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useQuery } from '@tanstack/react-query'
import { getAuditLog, type AuditEntry } from '@/shared/services/audit.service'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { formatDateTime } from '@/shared/lib/utils'
import { exportToPDF, exportToExcel } from '@/shared/services/export.service'
import {
  Shield,
  Search,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react'

const ENTITY_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'proposal', label: 'Propuestas' },
  { value: 'vote', label: 'Votos' },
  { value: 'transaction', label: 'Transacciones' },
  { value: 'member', label: 'Miembros' },
  { value: 'community', label: 'Comunidad' },
  { value: 'payment_obligation', label: 'Obligaciones' },
  { value: 'rules', label: 'Reglas' },
  { value: 'assembly', label: 'Asambleas' },
]

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  execute: 'bg-purple-100 text-purple-800',
  approve: 'bg-emerald-100 text-emerald-800',
  reject: 'bg-orange-100 text-orange-800',
}

function EntryDetail({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)

  const actionColor = Object.entries(ACTION_COLORS).find(([key]) =>
    entry.action.toLowerCase().includes(key)
  )?.[1] || 'bg-gray-100 text-gray-800'

  return (
    <div className="rounded-md border px-3 py-2.5 space-y-1">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionColor}`}>
            {entry.action}
          </span>
          <Badge variant="outline" className="text-[10px]">{entry.entity_type}</Badge>
          {entry.entity_id && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
              {entry.entity_id.slice(0, 8)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
          {Object.keys(entry.details || {}).length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-6 px-1">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && entry.details && (
        <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto mt-1">
          {JSON.stringify(entry.details, null, 2)}
        </pre>
      )}
    </div>
  )
}

export function AuditLogPage() {
  const { communityId, community } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const [entityType, setEntityType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log', communityId, entityType, page],
    queryFn: () =>
      getAuditLog(communityId!, {
        entityType: entityType || undefined,
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: !!communityId,
  })

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Solo los administradores pueden ver el log de auditoria.
        </p>
      </div>
    )
  }

  const filtered = (entries ?? []).filter((e) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      e.action.toLowerCase().includes(term) ||
      e.entity_type.toLowerCase().includes(term) ||
      (e.entity_id || '').toLowerCase().includes(term) ||
      JSON.stringify(e.details).toLowerCase().includes(term)
    )
  })

  const handleExportExcel = () => {
    const data = filtered.map((e) => ({
      Fecha: formatDateTime(e.created_at),
      Accion: e.action,
      Tipo: e.entity_type,
      Entidad_ID: e.entity_id || '',
      Usuario_ID: e.user_id || '',
      Detalles: JSON.stringify(e.details),
    }))
    exportToExcel(data, { filename: `auditoria-${community?.name || 'civitas'}`, sheetName: 'Auditoria' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Log de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro de todas las acciones en {community?.name || 'la comunidad'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToPDF('audit-list', { filename: 'auditoria', title: 'Log de Auditoria', subtitle: community?.name })}>
            <FileText className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por accion, tipo, ID..."
            className="pl-9"
          />
        </div>
        <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(0) }} className="w-full sm:w-48">
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </div>

      {/* Entries */}
      <div id="audit-list" className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando registros...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron registros.
            </CardContent>
          </Card>
        ) : (
          filtered.map((entry) => <EntryDetail key={entry.id} entry={entry} />)
        )}
      </div>

      {/* Pagination */}
      {(entries ?? []).length > 0 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {page + 1}</span>
          <Button variant="outline" size="sm" disabled={(entries ?? []).length < pageSize} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
