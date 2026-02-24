import { useParams } from 'react-router-dom'
import { ProposalDetail } from '@/core/governance/components/ProposalDetail'
import { Breadcrumb } from '@/shared/components/ui/breadcrumb'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

export function ProposalDetailPage() {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { proposalId: id } = useParams<{ proposalId: string }>()

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t('nav.governance'), to: path('governance') },
          { label: t('proposalDetail.title') },
        ]}
      />

      {id ? (
        <ProposalDetail proposalId={id} />
      ) : (
        <p className="text-muted-foreground">{t('proposalDetail.notFound')}</p>
      )}
    </div>
  )
}
