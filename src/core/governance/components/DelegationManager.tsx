import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { getDelegations, createDelegation, revokeDelegation } from '../services/governance.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Users, ArrowRight, X, AlertTriangle } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useState } from 'react'

interface Props {
  memberId: string
}

export function DelegationManager({ memberId }: Props) {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  const { data: members } = useMembers()
  const { canDelegate } = useRulesEngine()
  const toast = useToast()
  const [selectedMember, setSelectedMember] = useState('')

  const { data: delegations } = useQuery({
    queryKey: ['delegations', communityId],
    queryFn: () => getDelegations(communityId!),
    enabled: !!communityId,
  })

  const createMut = useMutation({
    mutationFn: () => createDelegation({
      community_id: communityId!,
      from_member_id: memberId,
      to_member_id: selectedMember,
      scope: 'all',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations', communityId] })
      setSelectedMember('')
    },
  })

  const revokeMut = useMutation({
    mutationFn: (delegationId: string) => revokeDelegation(delegationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delegations', communityId] }),
  })

  // My delegations (I delegated to someone)
  const myDelegations = delegations?.filter((d) => d.from_member_id === memberId) ?? []
  // Delegations to me (someone delegated to me)
  const delegationsToMe = delegations?.filter((d) => d.to_member_id === memberId) ?? []
  // Members I can delegate to (not myself, not already delegated)
  const delegatedToIds = new Set(myDelegations.map((d) => d.to_member_id))
  const eligibleMembers = members?.filter(
    (m) => m.id !== memberId && !delegatedToIds.has(m.id) && m.status === 'active'
  ) ?? []

  const getMemberName = (id: string) => {
    const m = members?.find((m) => m.id === id)
    return m?.full_name || m?.email || id.slice(0, 8)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Delegaciones
          {delegationsToMe.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              Votas en nombre de {delegationsToMe.length} miembro{delegationsToMe.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canDelegate.allowed && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{canDelegate.reason}</p>
          </div>
        )}

        {/* Delegations to me */}
        {delegationsToMe.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Te delegaron su voto:</p>
            {delegationsToMe.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{getMemberName(d.from_member_id)}</Badge>
                <ArrowRight className="h-3 w-3" />
                <span>Tú</span>
              </div>
            ))}
          </div>
        )}

        {/* My delegations */}
        {myDelegations.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Tu voto delegado a:</p>
            {myDelegations.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <span>Tú</span>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline">{getMemberName(d.to_member_id)}</Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => revokeMut.mutate(d.id, {
                    onSuccess: () => toast.success('Delegación revocada'),
                    onError: () => toast.error('Error al revocar delegación'),
                  })}
                  disabled={revokeMut.isPending}
                  aria-label="Revocar"
                >
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create delegation */}
        {canDelegate.allowed && myDelegations.length === 0 && eligibleMembers.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="flex-1"
            >
              <option value="">Delegar mi voto a...</option>
              {eligibleMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              onClick={() => createMut.mutate(undefined, {
                onSuccess: () => toast.success('Delegación creada exitosamente'),
                onError: () => toast.error('Error al crear delegación'),
              })}
              disabled={!selectedMember || createMut.isPending}
            >
              Delegar
            </Button>
          </div>
        )}

        {myDelegations.length === 0 && delegationsToMe.length === 0 && eligibleMembers.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay delegaciones activas.</p>
        )}
      </CardContent>
    </Card>
  )
}
