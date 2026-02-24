/**
 * Compliance Validation Engine
 *
 * Validates community rules against the applicable legal framework.
 * Used in onboarding (real-time validation) and settings (before save).
 */

import type { CommunityRules } from '@/shared/types/rules'
import type {
  ComplianceValidationResult,
  ComplianceViolation,
  LegalFramework,
  RuleConstraint,
} from './types'

/** Get a nested value from an object by dot-path */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/** Check if a value satisfies a constraint */
function checkConstraint(value: unknown, constraint: RuleConstraint): boolean {
  if ('min' in constraint) {
    return typeof value === 'number' && value >= constraint.min
  }
  if ('max' in constraint) {
    return typeof value === 'number' && value <= constraint.max
  }
  if ('equals' in constraint) {
    return value === constraint.equals
  }
  if ('oneOf' in constraint) {
    return constraint.oneOf.includes(value as string | number)
  }
  return true
}

/** Format constraint as human-readable string */
function formatConstraint(constraint: RuleConstraint): string {
  if ('min' in constraint) return `mínimo ${constraint.min}`
  if ('max' in constraint) return `máximo ${constraint.max}`
  if ('equals' in constraint) return `debe ser ${constraint.equals}`
  if ('oneOf' in constraint) return `debe ser uno de: ${constraint.oneOf.join(', ')}`
  return ''
}

/**
 * Validate community rules against a legal framework.
 *
 * @param rules - The community's current rules
 * @param framework - The legal framework to validate against
 * @returns Validation result with errors, warnings, and info
 */
export function validateCompliance(
  rules: CommunityRules,
  framework: LegalFramework,
): ComplianceValidationResult {
  const errors: ComplianceViolation[] = []
  const warnings: ComplianceViolation[] = []
  const info: ComplianceViolation[] = []

  // Check required rules (hard constraints from the law)
  for (const req of framework.requiredRules) {
    const value = getNestedValue(rules as unknown as Record<string, unknown>, req.rule)
    if (!checkConstraint(value, req.constraint)) {
      errors.push({
        message: `${req.description} (${formatConstraint(req.constraint)}, valor actual: ${value})`,
        reference: req.reference,
        severity: 'error',
        rule: req.rule,
      })
    }
  }

  // Check warning conditions
  for (const warning of framework.warnings) {
    if (warning.condition(rules)) {
      const violation: ComplianceViolation = {
        message: warning.message,
        reference: warning.reference,
        severity: warning.severity,
      }

      switch (warning.severity) {
        case 'error':
          errors.push(violation)
          break
        case 'warning':
          warnings.push(violation)
          break
        case 'info':
          info.push(violation)
          break
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}
