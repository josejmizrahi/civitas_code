/**
 * GAP-18: Revision of proposal templates — ensure all templates are well-formed
 * and that templates with financial instructions map to executable instruction types.
 */
import { describe, it, expect } from 'vitest'
import { PROPOSAL_TEMPLATES, getProposalTemplate, getTemplatesForType } from '../proposal-templates'

const EXECUTABLE_INSTRUCTION_TYPES = ['disbursement', 'budget_allocation', 'quota_change', 'removal', 'config_change', 'none']

describe('Proposal templates (GAP-18)', () => {
  it('should define at least 10 templates', () => {
    expect(PROPOSAL_TEMPLATES.length).toBeGreaterThanOrEqual(10)
  })

  it('each template should have required fields', () => {
    for (const t of PROPOSAL_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.type).toBeTruthy()
      expect(typeof t.hasFinancialInstruction).toBe('boolean')
      expect(t.guidance).toBeTruthy()
    }
  })

  it('templates with financial instruction should have executable defaultInstructionType', () => {
    for (const t of PROPOSAL_TEMPLATES) {
      if (t.hasFinancialInstruction && t.defaultInstructionType) {
        expect(EXECUTABLE_INSTRUCTION_TYPES).toContain(t.defaultInstructionType)
      }
    }
  })

  it('getProposalTemplate returns template by id', () => {
    expect(getProposalTemplate('gasto')?.id).toBe('gasto')
    expect(getProposalTemplate('remocion')?.id).toBe('remocion')
    expect(getProposalTemplate('nonexistent')).toBeUndefined()
  })

  it('getTemplatesForType returns only templates of that type', () => {
    const ordinary = getTemplatesForType('ordinary')
    expect(ordinary.every((t) => t.type === 'ordinary')).toBe(true)
    const amendment = getTemplatesForType('amendment')
    expect(amendment.every((t) => t.type === 'amendment')).toBe(true)
  })
})
