export type Role = 'admin' | 'tesorero' | 'miembro' | 'observador'

export type MemberStatus = 'active' | 'inactive' | 'pending'

export type ProposalStatus = 'draft' | 'active' | 'closed' | 'approved' | 'rejected'

export type ProposalType = 'ordinary' | 'extraordinary' | 'budget' | 'election' | 'amendment'

export type VoteValue = 'yes' | 'no' | 'abstain'

export type TransactionType = 'income' | 'expense'

export type CategoryType = 'income' | 'expense'

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type DataSourceType = 'csv' | 'excel' | 'api' | 'manual'

export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export type CommunityType = 'residential' | 'religious' | 'manufacturing' | 'cooperative' | 'other'

export type EntityType = 'proveedor' | 'socio_comercial' | 'contratista' | 'arrendador' | 'gobierno' | 'institucion' | 'otro'

export type EntityStatus = 'active' | 'inactive' | 'blacklisted'

export type ContractType = 'servicio' | 'obra' | 'arrendamiento' | 'mantenimiento' | 'suministro' | 'asesoria' | 'otro'

export type ContractStatus = 'draft' | 'active' | 'completed' | 'defaulted' | 'cancelled' | 'suspended'

export type RecurringType = 'collection' | 'payment'

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom'

export type RatingTargetType = 'entity' | 'member'

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  tesorero: 3,
  miembro: 2,
  observador: 1,
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
