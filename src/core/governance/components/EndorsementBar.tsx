import { useEndorsements, useAddEndorsement, useRemoveEndorsement } from '../hooks/useEndorsements'
import { useCommunityContext } from '@/app/providers'
import { useToast } from '@/shared/components/ui/toast'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { UserCheck, Users } from 'lucide-react'
import type { Proposal } from '../types'

interface Props {
  proposal: Proposal
}

export function EndorsementBar({ proposal }: Props) {
  const { currentMember } = useCommunityContext()
  const { data: endorsements, isLoading } = useEndorsements(proposal.id)
  const addEndorsement = useAddEndorsement()
  const removeEndorsement = useRemoveEndorsement()
  const toast = useToast()

  if (proposal.endorsements_required === 0) return null
  if (proposal.status !== 'draft') return null

  const count = endorsements?.length ?? 0
  const required = proposal.endorsements_required
  const isMet = count >= required
  const myEndorsement = endorsements?.find((e) => e.member_id === currentMember?.id)
  const isCreator = proposal.created_by === currentMember?.user_id

  const progress = Math.min((count / required) * 100, 100)

  const handleToggle = () => {
    if (!currentMember) return
    if (myEndorsement) {
      removeEndorsement.mutate(
        { proposalId: proposal.id, memberId: currentMember.id },
        {
          onSuccess: () => toast.success('Aval retirado'),
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al retirar aval'),
        }
      )
    } else {
      addEndorsement.mutate(
        { proposalId: proposal.id, memberId: currentMember.id },
        {
          onSuccess: (data) => {
            if (data.thresholdMet) {
              toast.success('Avales completos. La propuesta está lista para avanzar.')
            } else {
              toast.success('Aval registrado')
            }
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al avalar'),
        }
      )
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {count}/{required} avales
          </span>
          {isMet ? (
            <Badge variant="success">Completo</Badge>
          ) : (
            <Badge variant="secondary">Pendiente</Badge>
          )}
        </div>
        {!isCreator && currentMember && (
          <Button
            size="sm"
            variant={myEndorsement ? 'default' : 'outline'}
            onClick={handleToggle}
            disabled={isLoading || addEndorsement.isPending || removeEndorsement.isPending}
          >
            <UserCheck className="mr-1 h-3 w-3" />
            {myEndorsement ? 'Avalado' : 'Avalar'}
          </Button>
        )}
        {isCreator && (
          <span className="text-xs text-muted-foreground">Tu propuesta</span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isMet ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
