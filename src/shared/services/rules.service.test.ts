import { describe, it, expect } from 'vitest'
import { getCommunityRules, canPerformAction } from './rules.service'
import { DEFAULT_RULES } from '@/shared/types/rules'
import type { CommunityRules } from '@/shared/types/rules'

describe('getCommunityRules', () => {
  it('returns default rules when no config or rules', () => {
    const result = getCommunityRules(null)
    expect(result).toEqual(DEFAULT_RULES)
  })

  it('returns default rules when rules is null', () => {
    const result = getCommunityRules({}, null)
    expect(result.governance.default_quorum).toBe(DEFAULT_RULES.governance.default_quorum)
    expect(result.identity.payment_to_vote_enabled).toBe(DEFAULT_RULES.identity.payment_to_vote_enabled)
  })

  it('merges partial governance rules over defaults', () => {
    const result = getCommunityRules(null, {
      governance: { default_quorum: 0.75, delegation_enabled: false },
    } as any)
    expect(result.governance.default_quorum).toBe(0.75)
    expect(result.governance.delegation_enabled).toBe(false)
    expect(result.governance.default_majority).toBe(DEFAULT_RULES.governance.default_majority)
  })

  it('merges partial identity rules over defaults', () => {
    const result = getCommunityRules(null, {
      identity: { payment_to_vote_enabled: true, moroso_restrictions: ['vote'] },
    } as any)
    expect(result.identity.payment_to_vote_enabled).toBe(true)
    expect(result.identity.moroso_restrictions).toEqual(['vote'])
    expect(result.identity.grace_period_months).toBe(DEFAULT_RULES.identity.grace_period_months)
  })

  it('merges from config.rules when present', () => {
    const result = getCommunityRules({ rules: { treasury: { currency: 'USD' } } } as any)
    expect(result.treasury.currency).toBe('USD')
  })
})

describe('canPerformAction', () => {
  const defaultRules: CommunityRules = { ...DEFAULT_RULES }

  it('allows vote when good_standing and payment_to_vote disabled', () => {
    expect(canPerformAction('vote', 'miembro', 'good_standing', defaultRules)).toEqual({ allowed: true })
  })

  it('allows propose when role in proposal_rights', () => {
    expect(canPerformAction('propose', 'miembro', 'good_standing', defaultRules)).toEqual({ allowed: true })
  })

  it('denies propose when role not in proposal_rights', () => {
    const rules = { ...defaultRules, governance: { ...defaultRules.governance, proposal_rights: ['admin'] } }
    expect(canPerformAction('propose', 'miembro', 'good_standing', rules)).toEqual({
      allowed: false,
      reason: 'Tu rol no tiene permiso para crear propuestas',
    })
  })

  it('denies delegate when delegation_enabled is false', () => {
    const rules = { ...defaultRules, governance: { ...defaultRules.governance, delegation_enabled: false } }
    expect(canPerformAction('delegate', 'miembro', 'good_standing', rules)).toEqual({
      allowed: false,
      reason: 'La delegación está desactivada en esta comunidad',
    })
  })

  it('allows delegate when delegation_enabled is true', () => {
    expect(canPerformAction('delegate', 'miembro', 'good_standing', defaultRules)).toEqual({ allowed: true })
  })

  describe('moroso restrictions when payment_to_vote_enabled', () => {
    const morosoRules: CommunityRules = {
      ...defaultRules,
      identity: {
        ...defaultRules.identity,
        payment_to_vote_enabled: true,
        moroso_restrictions: ['vote', 'be_elected', 'quorum_excluded'],
      },
    }

    it('denies vote for moroso', () => {
      const r = canPerformAction('vote', 'miembro', 'moroso', morosoRules)
      expect(r.allowed).toBe(false)
      expect(r.reason).toContain('moroso')
    })

    it('denies be_elected for moroso', () => {
      const r = canPerformAction('be_elected', 'miembro', 'moroso', morosoRules)
      expect(r.allowed).toBe(false)
      expect(r.reason).toContain('electos')
    })

    it('allows quorum_excluded for moroso (excluded from quorum)', () => {
      const r = canPerformAction('quorum_excluded', 'miembro', 'moroso', morosoRules)
      expect(r.allowed).toBe(true)
      expect(r.reason).toContain('excluidos')
    })

    it('allows vote for good_standing even when payment_to_vote enabled', () => {
      expect(canPerformAction('vote', 'miembro', 'good_standing', morosoRules)).toEqual({ allowed: true })
    })
  })

  describe('delinquent (non-moroso) restrictions', () => {
    const delinquentRules: CommunityRules = {
      ...defaultRules,
      identity: {
        ...defaultRules.identity,
        payment_to_vote_enabled: true,
        delinquent_restrictions: ['vote', 'propose'],
      },
    }

    it('denies vote for delinquent', () => {
      const r = canPerformAction('vote', 'miembro', 'delinquent', delinquentRules)
      expect(r.allowed).toBe(false)
      expect(r.reason).toContain('vencidos')
    })

    it('allows vote for grace_period with warning', () => {
      const r = canPerformAction('vote', 'miembro', 'grace_period', delinquentRules)
      expect(r.allowed).toBe(true)
      expect(r.reason).toContain('gracia')
    })
  })
})
