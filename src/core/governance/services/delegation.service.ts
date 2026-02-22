import { supabase } from '@/shared/lib/supabase'
import { AppError } from '@/shared/lib/errors'
import type { Delegation } from '../types'

export async function getDelegations(communityId: string): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('delegations').select('*')
    .eq('community_id', communityId).eq('active', true)
  if (error) throw error
  return (data ?? []) as Delegation[]
}

/** Prevent chain A→B→C: delegatee cannot already be a delegator (only one level). */
export async function createDelegation(delegation: {
  community_id: string; from_member_id: string; to_member_id: string; scope: string
}): Promise<Delegation> {
  const { data: existing } = await supabase
    .from('delegations')
    .select('id')
    .eq('community_id', delegation.community_id)
    .eq('from_member_id', delegation.to_member_id)
    .eq('active', true)
    .limit(1)
  if (existing?.length) {
    throw new AppError(
      'Solo se permite un nivel de delegación. El delegado ya tiene delegaciones activas.',
      'VALIDATION',
    )
  }
  const { data, error } = await supabase.from('delegations')
    .insert({ ...delegation, active: true }).select().single()
  if (error) throw error
  return data as Delegation
}

export async function revokeDelegation(delegationId: string): Promise<void> {
  const { error } = await supabase.from('delegations')
    .update({ active: false }).eq('id', delegationId)
  if (error) throw error
}
