import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDecisionArchive, useSearchDecisions } from '../hooks/useDecisionArchive'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { cn } from '@/shared/lib/utils'
import {
  Archive,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  MessageSquare,
  ListTodo,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import type { DecisionArchiveEntry } from '../types'

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  approved: { label: 'Aprobada', icon: CheckCircle2, color: 'text-green-600' },
  rejected: { label: 'Rechazada', icon: XCircle, color: 'text-red-600' },
  executed: { label: 'Ejecutada', icon: Zap, color: 'text-purple-600' },
  closed: { label: 'Cerrada', icon: Clock, color: 'text-gray-500' },
  active: { label: 'Activa', icon: Clock, color: 'text-blue-600' },
  discussion: { label: 'En discusión', icon: MessageSquare, color: 'text-amber-600' },
  draft: { label: 'Borrador', icon: Clock, color: 'text-gray-400' },
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria',
  extraordinary: 'Extraordinaria',
  budget: 'Presupuesto',
  election: 'Elección',
  amendment: 'Enmienda',
}

export function DecisionArchive() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Use search or regular archive
  const isSearching = searchQuery.trim().length > 2
  const { data: archiveData, isLoading: archiveLoading } = useDecisionArchive()
  const { data: searchResults, isLoading: searchLoading } = useSearchDecisions(
    isSearching ? searchQuery : ''
  )

  const isLoading = isSearching ? searchLoading : archiveLoading
  const entries = isSearching ? searchResults : archiveData

  // Apply client-side filters
  const filtered = (entries ?? []).filter((entry) => {
    if (filterStatus !== 'all' && entry.status !== filterStatus) return false
    if (filterType !== 'all' && entry.type !== filterType) return false
    return true
  })

  // Stats
  const totalDecisions = archiveData?.length ?? 0
  const approvedCount = archiveData?.filter((e) => e.status === 'approved' || e.status === 'executed').length ?? 0
  const rejectedCount = archiveData?.filter((e) => e.status === 'rejected').length ?? 0
  const executedCount = archiveData?.filter((e) => e.status === 'executed').length ?? 0

  return (
    <div className="space-y-6">
      {/* Stats funnel */}
      <DecisionFunnel
        total={totalDecisions}
        approved={approvedCount}
        rejected={rejectedCount}
        executed={executedCount}
      />

      {/* Search and filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4" />
            Archivo de Decisiones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar decisiones..."
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos los estados</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="executed">Ejecutadas</option>
              <option value="closed">Cerradas</option>
              <option value="active">Activas</option>
            </Select>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Todos los tipos</option>
              <option value="ordinary">Ordinaria</option>
              <option value="extraordinary">Extraordinaria</option>
              <option value="budget">Presupuesto</option>
              <option value="election">Elección</option>
              <option value="amendment">Enmienda</option>
            </Select>
          </div>

          {/* Results */}
          {isLoading ? (
            <LoadingSpinner message="Buscando..." className="py-8" />
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isSearching
                ? `No se encontraron resultados para "${searchQuery}"`
                : 'No hay decisiones registradas aún.'}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.map((entry) => (
                <DecisionRow key={entry.id} entry={entry} onClick={() => navigate(`/governance/${entry.id}`)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DecisionRow({ entry, onClick }: { entry: DecisionArchiveEntry; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.closed
  const StatusIcon = statusCfg.icon

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
    >
      <StatusIcon className={cn('h-5 w-5 shrink-0', statusCfg.color)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{entry.title}</p>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {TYPE_LABELS[entry.type] ?? entry.type}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{new Date(entry.created_at).toLocaleDateString('es-MX')}</span>
          {entry.vote_count > 0 && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {entry.vote_count} votos
            </span>
          )}
          {entry.comment_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {entry.comment_count}
            </span>
          )}
          {entry.task_count > 0 && (
            <span className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              {entry.tasks_completed}/{entry.task_count}
            </span>
          )}
        </div>
        {entry.result && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{entry.result}</p>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

function DecisionFunnel({ total, approved, rejected, executed }: {
  total: number
  approved: number
  rejected: number
  executed: number
}) {
  if (total === 0) return null

  const steps = [
    { label: 'Propuestas', count: total, color: 'bg-blue-500', width: '100%' },
    { label: 'Aprobadas', count: approved, color: 'bg-green-500', width: total > 0 ? `${(approved / total) * 100}%` : '0%' },
    { label: 'Ejecutadas', count: executed, color: 'bg-purple-500', width: total > 0 ? `${(executed / total) * 100}%` : '0%' },
  ]

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">Embudo de Decisiones</p>
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground text-right">{step.label}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2', step.color)}
                  style={{ width: step.width, minWidth: step.count > 0 ? '2rem' : '0' }}
                >
                  {step.count > 0 && (
                    <span className="text-[10px] font-bold text-white">{step.count}</span>
                  )}
                </div>
              </div>
              {step.count > 0 && (
                <span className="text-xs font-medium w-10 text-right">
                  {total > 0 ? `${Math.round((step.count / total) * 100)}%` : ''}
                </span>
              )}
            </div>
          ))}
          {rejected > 0 && (
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground text-right">Rechazadas</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 flex items-center justify-end pr-2"
                  style={{ width: total > 0 ? `${(rejected / total) * 100}%` : '0%', minWidth: '2rem' }}
                >
                  <span className="text-[10px] font-bold text-white">{rejected}</span>
                </div>
              </div>
              <span className="text-xs font-medium w-10 text-right">
                {total > 0 ? `${Math.round((rejected / total) * 100)}%` : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
