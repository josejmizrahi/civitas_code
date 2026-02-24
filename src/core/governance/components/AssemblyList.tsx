import { useAssemblies } from '../hooks/useAssemblies'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { formatDateTime } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

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

const TYPE_VARIANTS: Record<string, 'default' | 'secondary'> = {
  ordinary: 'secondary',
  extraordinary: 'default',
}

interface Props {
  statusFilter?: string
}

export function AssemblyList({ statusFilter }: Props) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { data: assemblies, isLoading } = useAssemblies(statusFilter)
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
  const TYPE_LABELS: Record<string, string> = {
    ordinary: t('assemblies.type.ordinary'),
    extraordinary: t('assemblies.type.extraordinary'),
  }

  if (isLoading) return <LoadingSpinner message={t('assemblies.loading')} className="py-8" />

  if (!assemblies || assemblies.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{t('assemblies.empty')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {assemblies.map((a) => {
        const presentCount = (a.attendance || []).filter((r) => r.present).length
        const totalCount = (a.attendance || []).length

        return (
          <Link key={a.id} to={path(`governance/assemblies/${a.id}`)} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={a.type} variantMap={TYPE_VARIANTS} labelMap={TYPE_LABELS} />
                    <StatusBadge status={a.status} variantMap={STATUS_VARIANTS} labelMap={STATUS_LABELS} fallbackVariant="default" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(a.scheduled_date)}
                  </span>
                  {a.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {a.location}
                    </span>
                  )}
                  {totalCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {presentCount}/{totalCount} {t('assemblies.present')}
                    </span>
                  )}
                  {a.quorum_met && (
                    <Badge variant="success" className="text-xs">{t('assemblies.quorumMet')}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
