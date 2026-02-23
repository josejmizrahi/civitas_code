import { useProposals } from '../hooks/useProposals'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatDate } from '@/shared/lib/utils'
import { Link } from 'react-router-dom'
import { EndorsementBar } from './EndorsementBar'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  discussion: 'secondary',
  active: 'warning',
  closed: 'default',
  approved: 'success',
  rejected: 'destructive',
  executed: 'success',
}

interface Props {
  statusFilter?: string
}

export function ProposalList({ statusFilter }: Props) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { data: proposals, isLoading } = useProposals(statusFilter)
  const STATUS_LABELS: Record<string, string> = {
    draft: t('proposals.status.draft'),
    discussion: t('proposals.status.discussion'),
    active: t('proposals.status.active'),
    closed: t('proposals.status.closed'),
    approved: t('proposals.status.approved'),
    rejected: t('proposals.status.rejected'),
    executed: t('proposals.status.executed'),
  }
  const TYPE_LABELS: Record<string, string> = {
    ordinary: t('proposals.type.ordinary'),
    extraordinary: t('proposals.type.extraordinary'),
    budget: t('proposals.type.budget'),
    election: t('proposals.type.election'),
    amendment: t('proposals.type.amendment'),
  }

  if (isLoading) return <LoadingSpinner message={t('proposals.loading')} className="py-8" />

  if (!proposals || proposals.length === 0) {
    return <p className="text-muted-foreground">{t('proposals.empty')}</p>
  }

  return (
    <div className="grid gap-4">
      {proposals.map((p) => (
        <Link key={p.id} to={path(`governance/${p.id}`)} className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[p.type] || p.type}</Badge>
                  <Badge variant={STATUS_VARIANTS[p.status] || 'default'}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              {p.status === 'draft' && p.endorsements_required > 0 && (
                <div className="mb-2" onClick={(e) => e.preventDefault()}>
                  <EndorsementBar proposal={p} />
                </div>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{t('proposals.meta.created')}: {formatDate(p.created_at)}</span>
                {p.voting_start && <span>{t('proposals.meta.voting')}: {formatDate(p.voting_start)}</span>}
                {p.voting_end && <span>{t('proposals.meta.close')}: {formatDate(p.voting_end)}</span>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
