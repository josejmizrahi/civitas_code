/**
 * KybProvider Port — Know Your Business onboarding for communities
 *
 * THIS FILE DOES NOT CHANGE when you switch providers.
 */

export type KybStatus =
  | 'not_started'
  | 'draft'
  | 'documents_pending'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'requires_info'

export interface KybCommunityInfo {
  communityId: string
  name: string
  type: string
  taxId?: string
  legalRepresentative: string
  legalRepresentativeEmail: string
  address?: string
}

export interface KybApplication {
  id: string
  communityId: string
  status: KybStatus
  submittedAt?: string
  approvedAt?: string
  rejectedReason?: string
  requiredDocuments: string[]
  providerData?: Record<string, unknown>
}

export interface KybProvider {
  /** Provider identifier */
  readonly providerId: string

  /** Start KYB onboarding for a community */
  startOnboarding(info: KybCommunityInfo): Promise<KybApplication>

  /** Get current status */
  getStatus(applicationId: string): Promise<KybApplication>

  /** Submit additional documents or info */
  submitDocuments(applicationId: string, documents: Record<string, string>): Promise<KybApplication>
}
