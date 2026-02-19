import type { Role, MemberStatus, InvitationStatus, CommunityType } from '@/shared/types'
import type { CommunityRules, FinancialStanding } from '@/shared/types/rules'

export interface Community {
  id: string
  name: string
  slug: string
  type: CommunityType
  description?: string
  config: Record<string, unknown>
  rules: CommunityRules | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  community_id: string
  user_id: string
  role: Role
  status: MemberStatus
  financial_standing: FinancialStanding
  custom_attributes: Record<string, unknown>
  joined_at: string
  created_at: string
  // Joined from auth.users
  email?: string
  full_name?: string
  // Computed in hooks
  is_current_user?: boolean
}

export interface Invitation {
  id: string
  community_id: string
  email: string
  role: Role
  status: InvitationStatus
  token: string
  expires_at: string
  created_by: string
  created_at: string
}

export type MorosoNoticeType = 'pre_assembly' | 'warning' | 'suspension'
export type MorosoNoticeStatus = 'pending' | 'acknowledged' | 'resolved' | 'expired'

export interface MorosoNotice {
  id: string
  community_id: string
  member_id: string
  notice_type: MorosoNoticeType
  assembly_id: string | null
  outstanding_amount: number
  outstanding_obligations: Record<string, unknown>[]
  issued_at: string
  deadline: string | null
  response_at: string | null
  status: MorosoNoticeStatus
  created_at: string
  member_name?: string
}
