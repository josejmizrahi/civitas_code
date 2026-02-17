import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../rules'
import type { CommunityRules, TreasuryRules, GovernanceRules, IdentityRules } from '../rules'

describe('DEFAULT_RULES', () => {
  it('has all three sections', () => {
    expect(DEFAULT_RULES).toHaveProperty('governance')
    expect(DEFAULT_RULES).toHaveProperty('treasury')
    expect(DEFAULT_RULES).toHaveProperty('identity')
  })

  describe('governance defaults', () => {
    const gov = DEFAULT_RULES.governance

    it('has 50% default quorum', () => {
      expect(gov.default_quorum).toBe(0.5)
    })

    it('has 50% default majority', () => {
      expect(gov.default_majority).toBe(0.5)
    })

    it('enables delegation by default', () => {
      expect(gov.delegation_enabled).toBe(true)
    })

    it('allows admin, tesorero, and miembro to propose', () => {
      expect(gov.proposal_rights).toContain('admin')
      expect(gov.proposal_rights).toContain('tesorero')
      expect(gov.proposal_rights).toContain('miembro')
      expect(gov.proposal_rights).not.toContain('observador')
    })

    it('has 48-hour cool down', () => {
      expect(gov.cool_down_hours).toBe(48)
    })

    it('disables auto-execution by default', () => {
      expect(gov.auto_execution_enabled).toBe(false)
    })
  })

  describe('treasury defaults', () => {
    const treasury = DEFAULT_RULES.treasury

    it('starts in import mode', () => {
      expect(treasury.mode).toBe('import')
    })

    it('uses MXN currency', () => {
      expect(treasury.currency).toBe('MXN')
    })

    it('has spending limit of 50,000', () => {
      expect(treasury.admin_spending_limit).toBe(50000)
    })

    it('requires vote above 50,000', () => {
      expect(treasury.require_vote_above).toBe(50000)
    })

    it('has null CLABE by default', () => {
      expect(treasury.clabe).toBeNull()
    })

    it('disables auto-reconciliation by default', () => {
      expect(treasury.auto_reconciliation).toBe(false)
    })

    it('has 5-day collection reminder', () => {
      expect(treasury.collection_reminder_days).toBe(5)
    })
  })

  describe('identity defaults', () => {
    const identity = DEFAULT_RULES.identity

    it('disables payment-to-vote by default', () => {
      expect(identity.payment_to_vote_enabled).toBe(false)
    })

    it('has 2-month grace period', () => {
      expect(identity.grace_period_months).toBe(2)
    })

    it('enables auto-restore on payment', () => {
      expect(identity.auto_restore_on_payment).toBe(true)
    })

    it('restricts vote and propose for delinquent members', () => {
      expect(identity.delinquent_restrictions).toContain('vote')
      expect(identity.delinquent_restrictions).toContain('propose')
    })
  })
})

describe('CommunityRules type structure', () => {
  it('can create a valid CommunityRules object', () => {
    const rules: CommunityRules = {
      governance: {
        default_quorum: 0.3,
        default_majority: 0.6,
        delegation_enabled: false,
        proposal_rights: ['admin'],
        cool_down_hours: 24,
        auto_execution_enabled: true,
        auto_execution_threshold: 10000,
      },
      treasury: {
        mode: 'fintech_rail',
        currency: 'MXN',
        admin_spending_limit: 100000,
        require_vote_above: 100000,
        clabe: '012345678901234567',
        bank_name: 'STP',
        beneficiary_name: 'Mi Comunidad AC',
        payment_reference_prefix: 'MC-',
        auto_reconciliation: true,
        collection_reminder_days: 3,
      },
      identity: {
        payment_to_vote_enabled: true,
        grace_period_months: 1,
        auto_restore_on_payment: true,
        delinquent_restrictions: ['vote', 'propose', 'delegate'],
      },
    }
    expect(rules.treasury.mode).toBe('fintech_rail')
    expect(rules.treasury.clabe).toBe('012345678901234567')
    expect(rules.treasury.auto_reconciliation).toBe(true)
    expect(rules.governance.auto_execution_enabled).toBe(true)
    expect(rules.identity.payment_to_vote_enabled).toBe(true)
  })
})
