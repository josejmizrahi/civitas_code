export type ComplianceJurisdiction = 'mx' | 'us' | 'eu' | 'custom'

export interface ComplianceRules {
  jurisdiction: ComplianceJurisdiction
  privacy_framework: 'lfpdppp' | 'ccpa' | 'gdpr' | 'custom'
  property_framework: 'lpci_cdmx' | 'hoa_us' | 'none' | 'custom'
}
