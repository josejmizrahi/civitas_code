import { useParams, Link } from 'react-router-dom'
import { ProposalDetail } from '@/core/governance/components/ProposalDetail'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

export function ProposalDetailPage() {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { proposalId: id } = useParams<{ proposalId: string }>()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={path('governance')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('proposalDetail.back')}
          </Button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('proposalDetail.title')}</h1>
      </div>

      {id ? (
        <ProposalDetail proposalId={id} />
      ) : (
        <p className="text-muted-foreground">{t('proposalDetail.notFound')}</p>
      )}
    </div>
  )
}
