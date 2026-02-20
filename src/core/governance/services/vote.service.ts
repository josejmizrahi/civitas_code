import { supabase } from '@/shared/lib/supabase'
import { AppError } from '@/shared/lib/errors'
import type { Vote, VoteSummary } from '../types'
import { getProposal } from './proposal.service'

export async function getVotes(proposalId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('proposal_id', proposalId)
  if (error) throw error
  return (data ?? []) as Vote[]
}

export async function castVote(vote: {
  proposal_id: string
  member_id: string
  value: string
  block_reason?: string
}): Promise<Vote> {
  const proposal = await getProposal(vote.proposal_id)
  if (proposal.status !== 'active') throw new AppError('La propuesta no está activa para votación', 'VALIDATION')
  if (proposal.voting_end && new Date(proposal.voting_end) < new Date()) throw new AppError('El periodo de votación ha terminado', 'VALIDATION')

  const model = proposal.voting_model || 'simple'
  const validValues = getValidVoteValues(model, proposal.voting_options)
  if (!validValues.includes(vote.value)) throw new AppError(`Valor de voto "${vote.value}" no válido para modelo ${model}`, 'VALIDATION')
  if (model === 'consensus' && vote.value === 'block' && !vote.block_reason?.trim()) throw new AppError('El bloqueo requiere una razón obligatoria', 'VALIDATION')

  const { data: member, error: memberErr } = await supabase
    .from('members')
    .select('voting_weight')
    .eq('id', vote.member_id)
    .single()
  if (memberErr) throw memberErr
  const weight = Number((member as { voting_weight?: unknown })?.voting_weight) || 1

  const upsertData: Record<string, unknown> = {
    proposal_id: vote.proposal_id, member_id: vote.member_id, value: vote.value,
    weight, cast_at: new Date().toISOString(), block_reason: vote.block_reason || null,
  }

  const { data, error } = await supabase.from('votes')
    .upsert(upsertData as any, { onConflict: 'proposal_id,member_id' })
    .select().single()
  if (error) throw error
  return data as Vote
}

function getValidVoteValues(model: string, options?: { id: string; label: string }[]): string[] {
  switch (model) {
    case 'consensus': return ['agree', 'disagree', 'abstain', 'block']
    case 'multiple_choice': return (options ?? []).map((_, i) => `option_${i + 1}`)
    default: return ['yes', 'no', 'abstain']
  }
}

export async function castVoteWithDelegations(
  proposalId: string, memberId: string, value: string, communityId: string, blockReason?: string
): Promise<Vote[]> {
  const results: Vote[] = []
  const ownVote = await castVote({ proposal_id: proposalId, member_id: memberId, value, block_reason: blockReason })
  results.push(ownVote)

  const { data: delegations, error: delErr } = await supabase
    .from('delegations').select('*')
    .eq('community_id', communityId).eq('to_member_id', memberId).eq('active', true)
  if (delErr || !delegations) return results

  const existingVotes = await getVotes(proposalId)
  const votedMemberIds = new Set(existingVotes.map((v) => v.member_id))

  type DelegationRow = { from_member_id: string; to_member_id: string; [k: string]: unknown }
  const eligible = ((delegations ?? []) as DelegationRow[]).filter((d) => !votedMemberIds.has(d.from_member_id))
  if (eligible.length === 0) return results

  const delegatorIds = eligible.map((d) => d.from_member_id)
  const { data: delegatorMembers } = await supabase.from('members').select('id, voting_weight').in('id', delegatorIds)
  const weightMap = new Map<string, number>()
  for (const m of (delegatorMembers ?? []) as { id: string; voting_weight?: number }[]) {
    weightMap.set(m.id, Number(m.voting_weight) || 1)
  }

  for (const delegation of eligible) {
    const weight = weightMap.get(delegation.from_member_id) ?? 1
    const { data: delegatedVote, error: voteErr } = await supabase.from('votes')
      .insert({ proposal_id: proposalId, member_id: delegation.from_member_id, value, weight, delegated_from: memberId, cast_at: new Date().toISOString() })
      .select().single()
    if (!voteErr && delegatedVote) results.push(delegatedVote as Vote)
  }
  return results
}

export function computeVoteSummary(
  votes: Pick<Vote, 'value' | 'weight'>[], model: string,
  totalAvailableWeight: number, quorumRequired: number, majorityRequired: number
): VoteSummary {
  let yes = 0, no = 0, abstain = 0

  if (model === 'consensus') {
    for (const v of votes) {
      const w = v.weight || 1
      if (v.value === 'agree') yes += w
      else if (v.value === 'disagree' || v.value === 'block') no += w
      else abstain += w
    }
    const total = yes + no + abstain
    const participation_pct = totalAvailableWeight > 0 ? total / totalAvailableWeight : 0
    const quorum_met = participation_pct >= quorumRequired
    const hasBlocks = votes.some((v) => v.value === 'block')
    const votesForMajority = yes + no
    const majority_met = !hasBlocks && (votesForMajority > 0 ? yes / votesForMajority >= majorityRequired : false)
    return { yes, no, abstain, total, quorum_met, majority_met, participation_pct }
  }

  if (model === 'multiple_choice') {
    const optionCounts: Record<string, number> = {}
    let total = 0
    for (const v of votes) { const w = v.weight || 1; optionCounts[v.value] = (optionCounts[v.value] ?? 0) + w; total += w }
    const participation_pct = totalAvailableWeight > 0 ? total / totalAvailableWeight : 0
    const quorum_met = participation_pct >= quorumRequired
    const maxVotes = Math.max(0, ...Object.values(optionCounts))
    return { yes: maxVotes, no: total - maxVotes, abstain: 0, total, quorum_met, majority_met: quorum_met && maxVotes > 0, participation_pct }
  }

  for (const v of votes) { const w = v.weight || 1; if (v.value === 'yes') yes += w; else if (v.value === 'no') no += w; else abstain += w }
  const total = yes + no + abstain
  const participation_pct = totalAvailableWeight > 0 ? total / totalAvailableWeight : 0
  const quorum_met = participation_pct >= quorumRequired
  const votesForMajority = yes + no
  const majority_met = votesForMajority > 0 ? yes / votesForMajority >= majorityRequired : false
  return { yes, no, abstain, total, quorum_met, majority_met, participation_pct }
}

export async function getVoteSummary(
  proposalId: string, communityId: string, quorumRequired: number, majorityRequired: number
): Promise<VoteSummary> {
  const proposal = await getProposal(proposalId)
  const votes = await getVotes(proposalId)
  const model = proposal.voting_model || 'simple'

  const { data: members } = await supabase.from('members')
    .select('voting_weight, financial_standing')
    .eq('community_id', communityId).eq('status', 'active')

  type MemberWeightRow = { financial_standing?: string; voting_weight?: unknown }
  const totalAvailableWeight = ((members ?? []) as MemberWeightRow[])
    .filter((m) => m.financial_standing !== 'moroso')
    .reduce((sum: number, m) => sum + (Number(m.voting_weight) || 1), 0)

  return computeVoteSummary(votes, model, totalAvailableWeight, quorumRequired, majorityRequired)
}
