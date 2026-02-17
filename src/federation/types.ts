// Federation layer - placeholder for future implementation
// Handles inter-community connections and shared governance

export interface Federation {
  id: string
  name: string
  member_communities: string[]
  created_at: string
}

export interface FederationMembership {
  federation_id: string
  community_id: string
  joined_at: string
  status: 'active' | 'pending' | 'suspended'
}
