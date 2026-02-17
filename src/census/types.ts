// Census layer - placeholder for future implementation
// Tracks community size, growth metrics, and demographic data

export interface CensusSnapshot {
  id: string
  community_id: string
  total_members: number
  active_members: number
  snapshot_date: string
  metadata: Record<string, unknown>
}

export interface GrowthMetric {
  period: string
  new_members: number
  departed_members: number
  net_growth: number
}
