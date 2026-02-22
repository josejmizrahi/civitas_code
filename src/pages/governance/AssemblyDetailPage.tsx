import { useParams, useNavigate } from 'react-router-dom'
import { useAssembly, useConvocatorias, useUpdateAssemblyStatus } from '@/core/governance/hooks/useAssemblies'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/toast'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import { getCommunityRules } from '@/shared/services/rules.service'
import { ConvocatoriaCard } from '@/core/governance/components/ConvocatoriaCard'
import { QuorumTierIndicator } from '@/core/governance/components/QuorumTierIndicator'
import { AttendanceManager } from '@/core/governance/components/AttendanceManager'
import { ProxyManager } from '@/core/governance/components/ProxyManager'
import { ArrowLeft, Calendar, MapPin, User, Play, SkipForward, CheckCircle, XCircle } from 'lucide-react'
import { formatDateTime } from '@/shared/lib/utils'
import type { AssemblyStatus } from '@/core/governance/types'
import { useI18n } from '@/shared/hooks/useI18n'

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

export function AssemblyDetailPage() {
  const { t } = useI18n()
  const { assemblyId } = useParams<{ assemblyId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin } = usePermissions()
  const { community } = useCommunityContext()

  const { data: assembly, isLoading } = useAssembly(assemblyId)
  const { data: convocatorias } = useConvocatorias(assemblyId)
  const { data: members } = useMembers()
  const updateStatus = useUpdateAssemblyStatus()

  const rules = community
    ? getCommunityRules(community.config, community.rules as any)
    : null

  if (isLoading) return <LoadingSpinner message={t('assemblyDetail.loading')} fullPage />

  if (!assembly) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('assemblyDetail.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/governance')}>
          {t('assemblyDetail.backToGovernance')}
        </Button>
      </div>
    )
  }
  const STATUS_LABELS: Record<string, string> = {
    scheduled: t('assemblies.status.scheduled'),
    convened: t('assemblies.status.convened'),
    in_session: t('assemblies.status.in_session'),
    first_call: t('assemblies.status.first_call'),
    second_call: t('assemblies.status.second_call'),
    third_call: t('assemblies.status.third_call'),
    completed: t('assemblies.status.completed'),
    cancelled: t('assemblies.status.cancelled'),
  }

  const isActive = !['completed', 'cancelled'].includes(assembly.status)

  const handleStatusChange = async (newStatus: AssemblyStatus) => {
    try {
      await updateStatus.mutateAsync({ assemblyId: assembly.id, status: newStatus })
      toast.success(t('assemblyDetail.toast.statusUpdated').replace('{status}', STATUS_LABELS[newStatus]))
    } catch {
      toast.error(t('assemblyDetail.toast.statusError'))
    }
  }

  // Member list for attendance: full community members with voting weight (default 1.0 for non-residential)
  const memberList = (members ?? []).map((m) => ({
    id: m.id,
    name: m.full_name || m.email || t('assemblyDetail.memberFallback'),
    indiviso_pct: (m as { voting_weight?: number }).voting_weight ?? 1,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/governance')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{assembly.title}</h1>
            <Badge variant={STATUS_VARIANTS[assembly.status] || 'default'}>
              {STATUS_LABELS[assembly.status] || assembly.status}
            </Badge>
            <Badge variant={assembly.type === 'extraordinary' ? 'default' : 'secondary'}>
              {assembly.type === 'extraordinary' ? t('assemblies.type.extraordinary') : t('assemblies.type.ordinary')}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(assembly.scheduled_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {assembly.location}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {assembly.caller_name || t('assemblyDetail.defaultCaller')}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('assemblyDetail.actions')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {assembly.status === 'scheduled' && (
              <Button onClick={() => handleStatusChange('first_call')} disabled={updateStatus.isPending}>
                <Play className="h-4 w-4 mr-2" />
                {t('assemblyDetail.startFirstCall')}
              </Button>
            )}
            {assembly.status === 'first_call' && (
              <Button onClick={() => handleStatusChange('second_call')} disabled={updateStatus.isPending}>
                <SkipForward className="h-4 w-4 mr-2" />
                {t('assemblyDetail.toSecondCall')}
              </Button>
            )}
            {assembly.status === 'second_call' && (
              <Button onClick={() => handleStatusChange('third_call')} disabled={updateStatus.isPending}>
                <SkipForward className="h-4 w-4 mr-2" />
                {t('assemblyDetail.toThirdCall')}
              </Button>
            )}
            {['first_call', 'second_call', 'third_call'].includes(assembly.status) && (
              <>
                <Button onClick={() => handleStatusChange('in_session')} disabled={updateStatus.isPending} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  {t('assemblyDetail.startSession')}
                </Button>
                <Button onClick={() => handleStatusChange('completed')} disabled={updateStatus.isPending} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('assemblyDetail.complete')}
                </Button>
              </>
            )}
            {assembly.status === 'in_session' && (
              <Button onClick={() => handleStatusChange('completed')} disabled={updateStatus.isPending} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('assemblyDetail.completeAssembly')}
              </Button>
            )}
            <Button onClick={() => handleStatusChange('cancelled')} disabled={updateStatus.isPending} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              {t('assemblyDetail.cancel')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quorum Tier Indicator */}
      {rules && isActive && (
        <Card>
          <CardContent className="pt-6">
            <QuorumTierIndicator
              currentCall={assembly.current_call}
              currentPct={assembly.quorum_pct ? assembly.quorum_pct / 100 : 0}
              governanceRules={rules.governance}
              assemblyType={assembly.type}
            />
          </CardContent>
        </Card>
      )}

      {/* Agenda */}
      {assembly.agenda && assembly.agenda.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('assemblyDetail.agenda')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3">
              {assembly.agenda.map((item, index) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{item.topic}</span>
                  {item.description && (
                    <p className="ml-5 text-muted-foreground text-xs mt-0.5">{item.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Attendance Manager */}
      {isActive && memberList.length > 0 && (
        <AttendanceManager
          assemblyId={assembly.id}
          initialAttendance={assembly.attendance || []}
          memberList={memberList}
          disabled={!isAdmin}
        />
      )}

      {/* Proxy Manager — Art. 36 LPCI */}
      <ProxyManager
        assemblyId={assembly.id}
        disabled={!isAdmin || !isActive}
      />

      {/* Convocatorias */}
      {convocatorias && convocatorias.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('assemblyDetail.calls')}</h2>
          {convocatorias.map((c) => (
            <ConvocatoriaCard key={c.id} convocatoria={c} />
          ))}
        </div>
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
