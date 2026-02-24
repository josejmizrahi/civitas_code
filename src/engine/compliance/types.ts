/**
 * Compliance Engine — Legal framework per jurisdiction and entity type
 *
 * The law is NOT hardcoded. It's configured per jurisdiction + entity type.
 * Each framework declares:
 *   - Which laws apply
 *   - Which rules the law REQUIRES (hard constraints)
 *   - Default values the law SUGGESTS
 *   - Warnings when config violates the law
 */

import type { CommunityRules, GovernanceRules, TreasuryRules, IdentityRules } from '@/shared/types/rules'
import type { ComplianceRules } from '@/shared/types/compliance'

/** Deep partial — makes all nested properties optional */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface PartialCommunityRules {
  governance?: DeepPartial<GovernanceRules>
  treasury?: DeepPartial<TreasuryRules>
  identity?: DeepPartial<IdentityRules>
  compliance?: DeepPartial<ComplianceRules>
}

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface Law {
  id: string
  name: string
  url?: string
}

export interface RequiredRule {
  /** Dot-path to the rule, e.g. "governance.quorum_first_call" */
  rule: string
  /** Constraint the law imposes */
  constraint: RuleConstraint
  /** Legal reference, e.g. "LPCI Art. 33" */
  reference: string
  /** Human-readable explanation */
  description: string
}

export type RuleConstraint =
  | { min: number }
  | { max: number }
  | { equals: boolean | number | string }
  | { oneOf: (string | number)[] }

export type ComplianceWarningSeverity = 'error' | 'warning' | 'info'

export interface ComplianceWarning {
  /** Function that checks if the warning applies */
  condition: (rules: CommunityRules) => boolean
  /** Human-readable warning message */
  message: string
  /** error = blocks save, warning = allows but shows alert, info = informational */
  severity: ComplianceWarningSeverity
  /** Legal reference */
  reference?: string
}

export interface LegalFramework {
  /** Unique key, e.g. "mx.condominio" */
  key: string
  /** Jurisdiction */
  jurisdiction: string
  /** Entity type within jurisdiction */
  entityType: string
  /** Display name */
  displayName: string
  /** Laws that apply */
  applicableLaws: Law[]
  /** Rules the law makes mandatory */
  requiredRules: RequiredRule[]
  /** Suggested defaults from the law */
  defaultValues: PartialCommunityRules
  /** Validation warnings */
  warnings: ComplianceWarning[]
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ComplianceValidationResult {
  isValid: boolean
  errors: ComplianceViolation[]
  warnings: ComplianceViolation[]
  info: ComplianceViolation[]
}

export interface ComplianceViolation {
  message: string
  reference?: string
  severity: ComplianceWarningSeverity
  rule?: string
}
