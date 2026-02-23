import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { useMorosoMembers, useComputeMorosoStatus, useNotifyMorosos } from '../hooks/useMoroso'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/shared/components/ui/table'
import { formatDate, formatCurrency } from '@/shared/lib/utils'
import { AlertTriangle, RefreshCw, Bell, Ban, UserX, UsersRound } from 'lucide-react'
import { useMemberDebt } from '../hooks/useMoroso'
import type { Member } from '../types'

/** Member with moroso timestamps from member_profiles / view */
type MorosoMember = Member & { moroso_since?: string; moroso_notified_at?: string }

// ---------------------------------------------------------------------------
// Restriction labels
// ---------------------------------------------------------------------------

const restrictionLabels: Record<string, string> = {
  vote: 'No vota',
  be_elected: 'No elegible',
  quorum_excluded: 'Excluido quórum',
}

const restrictionIcons: Record<string, typeof Ban> = {
  vote: Ban,
  be_elected: UserX,
  quorum_excluded: UsersRound,
}

// ---------------------------------------------------------------------------
// Single row sub-component (fetches debt per member)
// ---------------------------------------------------------------------------

function MorosoRow({ member }: { member: MorosoMember }) {
  const { data: debt, isLoading } = useMemberDebt(member.id)

  return (
    <TableRow>
      <TableCell className="font-medium">
        {member.full_name ?? member.email ?? member.id.slice(0, 8)}
      </TableCell>
      <TableCell className="hidden md:table-cell text-center">
        {isLoading ? '...' : debt?.ordinary_unpaid ?? 0}
      </TableCell>
      <TableCell className="hidden md:table-cell text-center">
        {isLoading ? '...' : debt?.extraordinary_unpaid ?? 0}
      </TableCell>
      <TableCell className="text-right">
        {isLoading ? '...' : formatCurrency(debt?.total_debt ?? 0)}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDate(member.moroso_since ?? '')}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {member.moroso_notified_at
          ? formatDate(member.moroso_notified_at)
          : <span className="text-muted-foreground text-xs">Sin notificar</span>}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {(debt?.restrictions ?? []).map((r: string) => {
            const Icon = restrictionIcons[r]
            return (
              <Badge
                key={r}
                variant="destructive"
                className="text-[10px] gap-0.5"
              >
                {Icon && <Icon className="h-2.5 w-2.5" />}
                {restrictionLabels[r] ?? r}
              </Badge>
            )
          })}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// MorosoAdminPanel
// ---------------------------------------------------------------------------

export function MorosoAdminPanel() {
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { data: morosos, isLoading, error } = useMorosoMembers()
  const { rules } = useRulesEngine()
  const computeMutation = useComputeMorosoStatus()
  const notifyMutation = useNotifyMorosos()
  const [lastResult, setLastResult] = useState<string | null>(null)

  const handleRecompute = async () => {
    setLastResult(null)
    try {
      const changes = await computeMutation.mutateAsync()
      if (changes.length === 0) {
        setLastResult('Sin cambios. Todos los standings ya estaban actualizados.')
      } else {
        setLastResult(`${changes.length} miembro(s) actualizados.`)
      }
    } catch {
      setLastResult('Error al recalcular. Intenta de nuevo.')
    }
  }

  const handleNotify = async () => {
    setLastResult(null)
    try {
      await notifyMutation.mutateAsync()
      setLastResult('Notificaciones enviadas. Se actualizó moroso_notified_at.')
    } catch {
      setLastResult('Error al notificar. Intenta de nuevo.')
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Cargando morosos..." className="py-10" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Morosos — LPCI Art. 2, 36
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecompute}
              disabled={computeMutation.isPending}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${computeMutation.isPending ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(path('treasury'), {
                  state: { mainSection: 'programacion', programacionTab: 'payment-plans' },
                })
              }
            >
              Gestionar planes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNotify}
              disabled={notifyMutation.isPending || !morosos?.length}
            >
              <Bell className="mr-1.5 h-3.5 w-3.5" />
              Notificar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thresholds info */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            Umbral ordinarias: <span className="font-semibold text-foreground">{rules.identity.moroso_threshold_ordinary}</span> cuotas
          </span>
          <span>
            Umbral extraordinarias: <span className="font-semibold text-foreground">{rules.identity.moroso_threshold_extraordinary}</span> cuota(s)
          </span>
          <span>
            Aviso previo: <span className="font-semibold text-foreground">{rules.identity.moroso_notice_days}</span> días
          </span>
          <span>
            Auto-restaurar: <Badge variant={rules.identity.auto_restore_on_payment ? 'success' : 'secondary'} className="text-[10px]">
              {rules.identity.auto_restore_on_payment ? 'Sí' : 'No'}
            </Badge>
          </span>
        </div>

        {/* Status message */}
        {lastResult && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            {lastResult}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            Error al cargar morosos: {(error as Error).message}
          </div>
        )}

        {/* Table */}
        {morosos && morosos.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Ord. pendientes</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Ext. pendientes</TableHead>
                  <TableHead className="text-right">Deuda total</TableHead>
                  <TableHead className="hidden sm:table-cell">Moroso desde</TableHead>
                  <TableHead className="hidden lg:table-cell">Notificado</TableHead>
                  <TableHead>Restricciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {morosos.map((member) => (
                  <MorosoRow key={member.id} member={member} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No hay miembros morosos actualmente.</p>
          </div>
        )}

        {morosos && morosos.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Total morosos: <span className="font-semibold">{morosos.length}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
