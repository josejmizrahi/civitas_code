import type { ComplianceJurisdiction, ComplianceRules } from '@/shared/types/compliance'

export const COMPLIANCE_PRESETS: Record<ComplianceJurisdiction, ComplianceRules> = {
  mx: {
    jurisdiction: 'mx',
    privacy_framework: 'lfpdppp',
    property_framework: 'lpci_cdmx',
  },
  us: {
    jurisdiction: 'us',
    privacy_framework: 'ccpa',
    property_framework: 'hoa_us',
  },
  eu: {
    jurisdiction: 'eu',
    privacy_framework: 'gdpr',
    property_framework: 'none',
  },
  custom: {
    jurisdiction: 'custom',
    privacy_framework: 'custom',
    property_framework: 'custom',
  },
}

export function getCompliancePreset(jurisdiction: ComplianceJurisdiction): ComplianceRules {
  return COMPLIANCE_PRESETS[jurisdiction] ?? COMPLIANCE_PRESETS.custom
}
