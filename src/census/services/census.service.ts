import { supabase } from '@/shared/lib/supabase'

export interface CensusSnapshot {
  id: string
  community_id: string
  total_members: number
  active_members: number
  members_good_standing: number
  members_delinquent: number
  total_income: number
  total_expenses: number
  active_proposals: number
  snapshot_date: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface PlatformCensus {
  total_communities: number
  total_members: number
  active_members: number
  members_good_standing: number
  members_delinquent: number
  total_proposals: number
  active_proposals: number
  approved_proposals: number
  total_transactions: number
  total_income: number
  total_expenses: number
  total_delegations: number
  total_documents: number
  community_types: { type: string; count: number }[]
  snapshot_at: string
}

export async function getCensusSnapshots(communityId: string): Promise<CensusSnapshot[]> {
  const { data, error } = await supabase
    .from('census_snapshots')
    .select('*')
    .eq('community_id', communityId)
    .order('snapshot_date', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as CensusSnapshot[]
}

export async function takeCensusSnapshot(communityId: string): Promise<CensusSnapshot> {
  const { data, error } = await supabase.rpc('take_census_snapshot', {
    p_community_id: communityId,
  })
  if (error) throw error
  return data as unknown as CensusSnapshot
}

export async function getLatestCensus(communityId: string): Promise<CensusSnapshot | null> {
  const { data, error } = await supabase
    .from('census_snapshots')
    .select('*')
    .eq('community_id', communityId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as CensusSnapshot | null
}

export async function getPlatformCensus(): Promise<PlatformCensus> {
  const { data, error } = await supabase.rpc('get_platform_census')
  if (error) throw error
  return data as unknown as PlatformCensus
}
