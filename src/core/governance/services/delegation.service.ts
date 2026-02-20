import { supabase } from '@/shared/lib/supabase'
import type { Delegation } from '../types'

export async function getDelegations(communityId: string): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('delegations').select('*')
    .eq('community_id', communityId).eq('active', true)
  if (error) throw error
  return (data ?? []) as Delegation[]
}

export async function createDelegation(delegation: {
  community_id: string; from_member_id: string; to_member_id: string; scope: string
}): Promise<Delegation> {
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
