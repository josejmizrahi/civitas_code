import { supabase } from '@/shared/lib/supabase'
import { AppError } from '@/shared/lib/errors'
import { sendEmailToMembers } from '@/shared/services/email.service'
import type { Endorsement } from '../types'
import { getProposal } from './proposal.service'

export async function getEndorsements(proposalId: string): Promise<Endorsement[]> {
  const { data, error } = await (supabase as any).from('proposal_endorsements')
    .select('*').eq('proposal_id', proposalId).order('endorsed_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Endorsement[]
}

export async function addEndorsement(
  proposalId: string, memberId: string, communityId: string
): Promise<{ endorsements: Endorsement[]; thresholdMet: boolean }> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'draft') throw new AppError('Solo se pueden avalar propuestas en borrador', 'VALIDATION')
  if (proposal.created_by === memberId) throw new AppError('No puedes avalar tu propia propuesta', 'VALIDATION')

  const { error } = await (supabase as any).from('proposal_endorsements')
    .insert({ proposal_id: proposalId, member_id: memberId, community_id: communityId })
  if (error) {
    if (error.code === '23505') throw new AppError('Ya avalaste esta propuesta', 'CONFLICT')
    throw error
  }

  const endorsements = await getEndorsements(proposalId)
  const thresholdMet = proposal.endorsements_required > 0 && endorsements.length >= proposal.endorsements_required

  if (thresholdMet && !proposal.endorsements_met) {
    await (supabase.from('proposals') as any).update({ endorsements_met: true }).eq('id', proposalId)

    sendEmailToMembers(communityId, 'proposal_new', {
      title: proposal.title, description: proposal.description, proposal_type: proposal.type,
      author_name: proposal.created_by, proposal_id: proposal.id, community_name: communityId, app_url: window.location.origin,
    }).catch(() => {})

    try {
      const { notifyCommunity } = await import('@/shared/services/notification.service')
      await notifyCommunity(communityId, 'proposal_new', `Propuesta avalada: ${proposal.title}`, 'La propuesta ha reunido los avales necesarios y está lista para avanzar', { proposal_id: proposalId })
    } catch { /* best-effort */ }
  }

  return { endorsements, thresholdMet }
}

export async function removeEndorsement(proposalId: string, memberId: string): Promise<void> {
  const { error } = await (supabase as any).from('proposal_endorsements')
    .delete().eq('proposal_id', proposalId).eq('member_id', memberId)
  if (error) throw error

  const proposal = await getProposal(proposalId)
  const endorsements = await getEndorsements(proposalId)
  const stillMet = proposal.endorsements_required === 0 || endorsements.length >= proposal.endorsements_required
  if (!stillMet && proposal.endorsements_met) {
    await (supabase.from('proposals') as any).update({ endorsements_met: false }).eq('id', proposalId)
  }
}
