export type Role = 'platform_admin' | 'admin' | 'comite_vigilancia' | 'tesorero' | 'miembro' | 'observador'

export type MemberStatus = 'active' | 'inactive' | 'pending'

export type ProposalStatus = 'draft' | 'discussion' | 'active' | 'closed' | 'approved' | 'rejected' | 'executed'

export type ProposalType = 'ordinary' | 'extraordinary' | 'budget' | 'election' | 'amendment'

export type VoteValue = 'yes' | 'no' | 'abstain' | 'agree' | 'disagree' | 'block'
  | 'option_1' | 'option_2' | 'option_3' | 'option_4' | 'option_5'
  | 'option_6' | 'option_7' | 'option_8' | 'option_9' | 'option_10'

export type VotingModel = 'simple' | 'consensus' | 'multiple_choice'

export type TransactionType = 'income' | 'expense'

export type CategoryType = 'income' | 'expense'

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type DataSourceType = 'csv' | 'excel' | 'api' | 'manual'

export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export type CommunityType =
  | 'residential'   // Condominios, fraccionamientos
  | 'association'   // Asociaciones civiles (A.C.)
  | 'club'          // Clubes deportivos, sociales, culturales
  | 'school'        // Escuelas, sociedades de padres
  | 'religious'     // Iglesias, templos, congregaciones
  | 'ngo'           // ONGs, fundaciones, donatarias
  | 'cooperative'   // Cooperativas
  | 'custom'        // Cualquier otra comunidad
  // Legacy (mapped to new types)
  | 'manufacturing' // → maps to 'cooperative' in presets
  | 'other'         // → maps to 'custom' in presets

export type EntityType = 'proveedor' | 'socio_comercial' | 'contratista' | 'arrendador' | 'gobierno' | 'institucion' | 'otro'

export type EntityStatus = 'active' | 'inactive' | 'blacklisted'

export type ContractType = 'servicio' | 'obra' | 'arrendamiento' | 'mantenimiento' | 'suministro' | 'asesoria' | 'otro'

export type ContractStatus = 'draft' | 'active' | 'completed' | 'defaulted' | 'cancelled' | 'suspended'

export type RecurringType = 'collection' | 'payment'

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom'

export type RatingTargetType = 'entity' | 'member'

export const ROLE_HIERARCHY: Record<Role, number> = {
  platform_admin: 5,
  admin: 4,
  comite_vigilancia: 3,
  tesorero: 3,
  miembro: 2,
  observador: 1,
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
