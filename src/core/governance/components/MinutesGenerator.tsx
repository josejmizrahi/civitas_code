import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { generateMinutes, getMinutes } from '../services/governance.service'
import { useApproveMinutes, useSignMinutes } from '../hooks/useVoting'
import { useCommunityContext, useAuth } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useMembers } from '@/core/identity/hooks/useMembers'
import type { Proposal, VoteSummary } from '../types'
import { FileText, Loader2, CheckCircle, PenTool, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/shared/lib/utils'
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  proposal: Proposal
  voteSummary: VoteSummary | undefined
}

export function MinutesGenerator({ proposal, voteSummary }: Props) {
  const { t } = useI18n()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const { data: members } = useMembers()
  const [generating, setGenerating] = useState(false)

  const approveMinutesMut = useApproveMinutes()
  const signMinutesMut = useSignMinutes()

  const { data: existingMinutes, refetch } = useQuery({
    queryKey: ['minutes', proposal.id],
    queryFn: () => getMinutes(proposal.id),
  })

  const currentMember = members?.find((m) => m.user_id === user?.id)

  const handleGenerate = async () => {
    if (!communityId || !voteSummary) return
    setGenerating(true)
    try {
      await generateMinutes(communityId, proposal.id, proposal, voteSummary)
      refetch()
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = () => {
    if (!existingMinutes || !user) return
    approveMinutesMut.mutate(
      { minutesId: existingMinutes.id, userId: user.id },
      { onSuccess: () => refetch() }
    )
  }

  const handleSign = () => {
    if (!existingMinutes || !currentMember) return
    signMinutesMut.mutate(
      {
        minutesId: existingMinutes.id,
        memberId: currentMember.id,
        memberName: currentMember.full_name || currentMember.email || t('minutes.memberFallback'),
      },
      { onSuccess: () => refetch() }
    )
  }

  const alreadySigned = existingMinutes?.signatures?.some(
    (s) => s.member_id === currentMember?.id
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {t('minutes.title')}
          {existingMinutes?.approved && (
            <Badge variant="success" className="ml-2">
              <CheckCircle className="mr-1 h-3 w-3" />
              {t('minutes.approved')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {existingMinutes ? (
          <>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {existingMinutes.content}
            </pre>

            {/* Approval info */}
            {existingMinutes.approved && existingMinutes.approved_at && (
              <p className="text-xs text-muted-foreground">
                {t('minutes.approvedAt')} {formatDate(existingMinutes.approved_at)}
              </p>
            )}

            {/* Signatures */}
            {existingMinutes.signatures && existingMinutes.signatures.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('minutes.signatures').replace('{count}', String(existingMinutes.signatures.length))}</p>
                {existingMinutes.signatures.map((sig, i) => {
                  const member = members?.find(m => m.id === sig.member_id)
                  const roleLabel = member?.role === 'admin' ? t('minutes.role.secretary') : member?.role === 'comite_vigilancia' ? t('minutes.role.committee') : t('minutes.memberFallback')
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <Shield className="h-3 w-3 text-green-600 shrink-0" />
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{roleLabel}</Badge>
                      <span className="font-medium">{sig.member_name}</span>
                      <span className="text-muted-foreground">
                        — {formatDate(sig.signed_at)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground break-all">
                        {sig.hash.slice(0, 12)}...
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              {/* Approve button (admin only, not yet approved) */}
              {isAdmin && !existingMinutes.approved && (
                <Button
                  onClick={handleApprove}
                  disabled={approveMinutesMut.isPending}
                  size="sm"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approveMinutesMut.isPending ? t('minutes.approving') : t('minutes.approve')}
                </Button>
              )}

              {/* Sign button (any member, not already signed) */}
              {currentMember && !alreadySigned && (
                <Button
                  onClick={handleSign}
                  disabled={signMinutesMut.isPending}
                  variant="outline"
                  size="sm"
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  {signMinutesMut.isPending ? t('minutes.signing') : t('minutes.sign')}
                </Button>
              )}

              {alreadySigned && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" /> {t('minutes.alreadySigned')}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('minutes.description')}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating || !voteSummary || proposal.status === 'active'}
              variant="outline"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('minutes.generating')}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('minutes.generate')}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
