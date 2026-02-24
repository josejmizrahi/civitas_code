export { validateCompliance } from './engine'
export type {
  LegalFramework,
  Law,
  RequiredRule,
  RuleConstraint,
  ComplianceWarning,
  ComplianceWarningSeverity,
  ComplianceValidationResult,
  ComplianceViolation,
} from './types'

// Legal frameworks by jurisdiction
import { condominioFramework } from './mx/condominio'
import { acFramework } from './mx/ac'
import { cooperativaFramework } from './mx/cooperativa'
import { arFramework } from './mx/ar'
import { donatariaFramework } from './mx/donataria'
import type { LegalFramework } from './types'

/** Registry of all legal frameworks, keyed by framework key */
export const LEGAL_FRAMEWORKS: Record<string, LegalFramework> = {
  'mx.condominio': condominioFramework,
  'mx.ac': acFramework,
  'mx.cooperativa': cooperativaFramework,
  'mx.ar': arFramework,
  'mx.donataria': donatariaFramework,
}

/** Get legal framework by key. Returns null if not found. */
export function getLegalFramework(key: string | null): LegalFramework | null {
  if (!key) return null
  return LEGAL_FRAMEWORKS[key] ?? null
}

export {
  condominioFramework,
  acFramework,
  cooperativaFramework,
  arFramework,
  donatariaFramework,
}
