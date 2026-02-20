import { useMemo, useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useAdminTerms, useStartTerm, useEndTerm } from '../hooks/useTerms'
import { useMembers } from '../hooks/useMembers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Select } from '@/shared/components/ui/select'
import { formatDate } from '@/shared/lib/utils'
import { getCommunityRules } from '@/shared/services/rules.service'
import { Shield, Clock, AlertTriangle, UserCheck, Play, Square } from 'lucide-react'
import type { AdminTerm } from '../services/terms.service'

const roleLabels: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  comite_vigilancia: 'Comité de Vigilancia',
  tesorero: 'Tesorero',
  miembro: 'Miembro',
  observador: 'Observador',
}

function TermProgressBar({ term, termMonths }: { term: AdminTerm; termMonths: number }) {
  const { progress, isNearEnd } = useMemo(() => {
    const start = new Date(term.term_start).getTime()
    const expectedEnd = start + termMonths * 30 * 24 * 60 * 60 * 1000
    const now = Date.now() // eslint-disable-line react-hooks/purity
    const p = Math.min(((now - start) / (expectedEnd - start)) * 100, 100)
    return { progress: p, isNearEnd: p >= 80 }
  }, [term.term_start, termMonths])

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(term.term_start)}</span>
        <span>{Math.round(progress)}% transcurrido</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearEnd ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isNearEnd && (
        <p className="flex items-center gap-1 text-xs text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          Periodo cerca de finalizar
        </p>
      )}
    </div>
  )
}

export function AdminTermTracker() {
  const { communityId: _communityId, community } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const { data: terms, isLoading } = useAdminTerms()
  const { data: members } = useMembers()
  const startTermMut = useStartTerm()
  const endTermMut = useEndTerm()

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRole, setSelectedRole] = useState('admin')

  const rules = getCommunityRules(null, (community?.rules ?? null) as Record<string, unknown> | null)
  const maxTerms = rules.identity.admin_max_consecutive_terms
  const termMonths = rules.identity.admin_term_months

  const activeTerms = (terms ?? []).filter((t) => t.status === 'active')
  const completedTerms = (terms ?? []).filter((t) => t.status !== 'active')

  // Build member name map
  const memberMap = new Map<string, string>()
  ;(members ?? []).forEach((m: { id: string; full_name?: string; email?: string }) => {
    memberMap.set(m.id, m.full_name || m.email || m.id)
  })

  const handleStartTerm = () => {
    if (!selectedMemberId) return
    startTermMut.mutate({ memberId: selectedMemberId, role: selectedRole })
    setSelectedMemberId('')
  }

  const handleEndTerm = (termId: string) => {
    endTermMut.mutate(termId)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>
      case 'completed':
        return <Badge variant="secondary">Completado</Badge>
      case 'removed':
        return <Badge variant="destructive">Removido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando terminos...</p>
  }

  return (
    <div className="space-y-6">
      {/* Active Terms Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Terminos Activos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTerms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay terminos activos registrados.
            </p>
          ) : (
            activeTerms.map((term) => (
              <div
                key={term.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {memberMap.get(term.member_id) ?? term.member_id}
                    </span>
                    <Badge variant="outline">{roleLabels[term.role] ?? term.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      Periodo {term.term_number} de {maxTerms}
                    </span>
                    {term.term_number >= maxTerms && (
                      <Badge variant="warning">Ultimo periodo</Badge>
                    )}
                  </div>
                </div>

                <TermProgressBar term={term} termMonths={termMonths} />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Duracion: {termMonths} meses
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEndTerm(term.id)}
                      disabled={endTermMut.isPending}
                    >
                      <Square className="h-3.5 w-3.5 mr-1" />
                      Finalizar periodo
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Start New Term (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Play className="h-5 w-5 text-green-600" />
              Registrar Nuevo Periodo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              LPCI CDMX Art. 42: Maximo {maxTerms} periodos consecutivos de {termMonths} meses.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1 flex-1 min-w-0">
                <label className="text-sm font-medium">Miembro</label>
                <Select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full sm:w-60"
                >
                  <option value="">Seleccionar miembro...</option>
                  {(members ?? []).map((m: { id: string; full_name?: string; email?: string }) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email || m.id}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <label className="text-sm font-medium">Cargo</label>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full sm:w-52"
                >
                  <option value="admin">Administrador</option>
                  <option value="comite_vigilancia">Comite de Vigilancia</option>
                </Select>
              </div>
              <Button
                onClick={handleStartTerm}
                disabled={!selectedMemberId || startTermMut.isPending}
                className="w-full sm:w-auto"
              >
                {startTermMut.isPending ? 'Registrando...' : 'Iniciar Periodo'}
              </Button>
            </div>
            {startTermMut.isError && (
              <p className="text-sm text-destructive">
                Error al registrar el periodo. Verifica si el miembro puede ser reelecto.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Term History */}
      {completedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Historial de Periodos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="hidden sm:table-cell">Periodo #</TableHead>
                    <TableHead className="hidden sm:table-cell">Inicio</TableHead>
                    <TableHead className="hidden sm:table-cell">Fin</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">
                        {memberMap.get(term.member_id) ?? term.member_id}
                      </TableCell>
                      <TableCell>{roleLabels[term.role] ?? term.role}</TableCell>
                      <TableCell className="hidden sm:table-cell">{term.term_number}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(term.term_start)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(term.term_end)}</TableCell>
                      <TableCell>{statusBadge(term.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
