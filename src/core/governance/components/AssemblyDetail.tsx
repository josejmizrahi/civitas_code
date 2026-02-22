import { useAssembly, useConvocatorias, useUpdateAssemblyStatus } from '../hooks/useAssemblies'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useToast } from '@/shared/components/ui/toast'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import { getCommunityRules } from '@/shared/services/rules.service'
import { formatDateTime } from '@/shared/lib/utils'
import { ConvocatoriaCard } from './ConvocatoriaCard'
import { AttendanceManager } from './AttendanceManager'
import { QuorumTierIndicator } from './QuorumTierIndicator'
import { calculateAssemblyQuorum } from '../services/assembly.service'
import {
  Calendar,
  MapPin,
  User,
  PlayCircle,
  SkipForward,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { AssemblyStatus } from '../types'
import { useI18n } from '@/shared/hooks/useI18n'

const STATUS_LABEL_KEYS: Record<string, string> = {
  scheduled: 'assemblyDetail.status.scheduled',
  convened: 'assemblyDetail.status.convened',
  in_session: 'assemblyDetail.status.inSession',
  first_call: 'assemblyDetail.status.firstCall',
  second_call: 'assemblyDetail.status.secondCall',
  third_call: 'assemblyDetail.status.thirdCall',
  completed: 'assemblyDetail.status.completed',
  cancelled: 'assemblyDetail.status.cancelled',
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

const TYPE_LABEL_KEYS: Record<string, string> = {
  ordinary: 'assemblyDetail.type.ordinary',
  extraordinary: 'assemblyDetail.type.extraordinary',
}

interface Props {
  assemblyId: string
}

export function AssemblyDetail({ assemblyId }: Props) {
  const { t } = useI18n()
  const { data: assembly, isLoading } = useAssembly(assemblyId)
  const { data: convocatorias } = useConvocatorias(assemblyId)
  const updateStatus = useUpdateAssemblyStatus()
  const { isAdmin } = usePermissions()
  const { community } = useCommunityContext()
  const toast = useToast()

  const rules = community
    ? getCommunityRules(community.config, community.rules as any)
    : null
  const governanceRules = rules?.governance

  if (isLoading) return <LoadingSpinner message={t('assemblyDetail.loading')} className="py-8" />
  if (!assembly) return <p className="text-muted-foreground">{t('assemblyDetail.notFound')}</p>

  const quorumInfo =
    governanceRules && assembly.attendance?.length
      ? calculateAssemblyQuorum(
          assembly.attendance,
          governanceRules,
          assembly.current_call,
          assembly.type
        )
      : null

  const isActive = !['completed', 'cancelled'].includes(assembly.status)

  async function handleStatusChange(newStatus: AssemblyStatus) {
    try {
      await updateStatus.mutateAsync({
        assemblyId: assembly!.id,
        status: newStatus,
      })
      toast.success(
        t('assemblyDetail.statusUpdated').replace(
          '{status}',
          STATUS_LABEL_KEYS[newStatus] ? t(STATUS_LABEL_KEYS[newStatus] as never) : newStatus
        )
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('assemblyDetail.statusUpdateError'))
    }
  }

  // Determine available actions
  const availableActions: { status: AssemblyStatus; label: string; icon: typeof PlayCircle; variant?: 'default' | 'destructive' | 'outline' }[] = []

  if (isAdmin && isActive) {
    switch (assembly.status) {
      case 'scheduled':
        availableActions.push({
          status: 'first_call',
          label: t('assemblyDetail.action.startFirst'),
          icon: PlayCircle,
        })
        availableActions.push({
          status: 'cancelled',
          label: t('assemblyDetail.action.cancel'),
          icon: XCircle,
          variant: 'destructive',
        })
        break
      case 'first_call':
        availableActions.push({
          status: 'second_call',
          label: t('assemblyDetail.action.toSecond'),
          icon: SkipForward,
        })
        if (quorumInfo?.quorumMet) {
          availableActions.push({
            status: 'in_session',
            label: t('assemblyDetail.action.startSession'),
            icon: PlayCircle,
          })
        }
        break
      case 'second_call':
        availableActions.push({
          status: 'third_call',
          label: t('assemblyDetail.action.toThird'),
          icon: SkipForward,
        })
        if (quorumInfo?.quorumMet) {
          availableActions.push({
            status: 'in_session',
            label: t('assemblyDetail.action.startSession'),
            icon: PlayCircle,
          })
        }
        break
      case 'third_call':
        availableActions.push({
          status: 'in_session',
          label: t('assemblyDetail.action.startSession'),
          icon: PlayCircle,
        })
        break
      case 'in_session':
        availableActions.push({
          status: 'completed',
          label: t('assemblyDetail.action.complete'),
          icon: CheckCircle2,
        })
        break
    }
  }

  // Latest convocatoria
  const latestConvocatoria =
    convocatorias && convocatorias.length > 0
      ? convocatorias[convocatorias.length - 1]
      : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{assembly.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant={assembly.type === 'extraordinary' ? 'default' : 'secondary'}>
                  {TYPE_LABEL_KEYS[assembly.type] ? t(TYPE_LABEL_KEYS[assembly.type] as never) : assembly.type}
                </Badge>
                <Badge variant={STATUS_VARIANTS[assembly.status] || 'default'}>
                  {STATUS_LABEL_KEYS[assembly.status] ? t(STATUS_LABEL_KEYS[assembly.status] as never) : assembly.status}
                </Badge>
                {assembly.quorum_met && (
                  <Badge variant="success">{t('assemblyDetail.quorumMet')}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(assembly.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{assembly.location || t('assemblyDetail.noLocation')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{t('assemblyDetail.calledBy')}: {assembly.caller_name || t('assemblyDetail.callerDefault')}</span>
            </div>
          </div>

          {/* Actions */}
          {availableActions.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap mt-4 pt-4 border-t">
              {availableActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.status}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={() => handleStatusChange(action.status)}
                    disabled={updateStatus.isPending}
                  >
                    <Icon className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convocatoria */}
      {latestConvocatoria && (
        <ConvocatoriaCard convocatoria={latestConvocatoria} />
      )}

      {/* Quorum Tier Indicator */}
      {governanceRules && (
        <Card>
          <CardContent className="pt-6">
            <QuorumTierIndicator
              currentCall={assembly.current_call}
              currentPct={quorumInfo?.currentPct ?? 0}
              governanceRules={governanceRules}
              assemblyType={assembly.type}
            />
          </CardContent>
        </Card>
      )}

      {/* Attendance Manager (admin only) */}
      {isAdmin && isActive && (
        <AttendanceManager
          assemblyId={assembly.id}
          initialAttendance={assembly.attendance || []}
          memberList={(assembly.attendance || []).map((r) => ({
            id: r.member_id,
            name: r.member_name,
            indiviso_pct: r.indiviso_pct,
          }))}
        />
      )}

      {/* Agenda */}
      {assembly.agenda && assembly.agenda.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('assemblyDetail.agenda')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {assembly.agenda.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-medium shrink-0">
                    {item.order || index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.topic}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {assembly.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('assemblyDetail.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{assembly.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
