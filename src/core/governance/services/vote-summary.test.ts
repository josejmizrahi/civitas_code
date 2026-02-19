import { describe, it, expect } from 'vitest'
import { computeVoteSummary } from './governance.service'
import type { Vote } from '../types'

function v(value: string, weight = 1): Pick<Vote, 'value' | 'weight'> {
  return { value: value as Vote['value'], weight }
}

describe('computeVoteSummary', () => {
  const totalWeight = 100
  const quorum = 0.5
  const majority = 0.5

  describe('simple model', () => {
    it('counts yes/no/abstain by weight', () => {
      const summary = computeVoteSummary(
        [v('yes', 10), v('no', 5), v('abstain', 3)],
        'simple',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.yes).toBe(10)
      expect(summary.no).toBe(5)
      expect(summary.abstain).toBe(3)
      expect(summary.total).toBe(18)
      expect(summary.participation_pct).toBe(0.18)
    })

    it('quorum_met when participation >= quorum', () => {
      const summary = computeVoteSummary(
        [v('yes', 60), v('no', 0)],
        'simple',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.quorum_met).toBe(true)
      expect(summary.participation_pct).toBeGreaterThanOrEqual(0.59)
      expect(summary.participation_pct).toBeLessThanOrEqual(0.61)
    })

    it('quorum not met when participation below quorum', () => {
      const summary = computeVoteSummary(
        [v('yes', 10), v('no', 10)],
        'simple',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.quorum_met).toBe(false)
    })

    it('majority_met when yes / (yes+no) >= majority', () => {
      const summary = computeVoteSummary(
        [v('yes', 40), v('no', 30), v('abstain', 10)],
        'simple',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.majority_met).toBe(true)
      expect(summary.yes / (summary.yes + summary.no)).toBeGreaterThanOrEqual(majority)
    })

    it('majority not met when yes below majority of yes+no', () => {
      const summary = computeVoteSummary(
        [v('yes', 30), v('no', 40)],
        'simple',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.majority_met).toBe(false)
    })
  })

  describe('consensus model', () => {
    it('maps agree=yes, disagree=no, block=no', () => {
      const summary = computeVoteSummary(
        [v('agree', 5), v('disagree', 3), v('block', 2), v('abstain', 1)],
        'consensus',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.yes).toBe(5)
      expect(summary.no).toBe(5)
      expect(summary.abstain).toBe(1)
    })

    it('majority not met when any block vote (GV-012)', () => {
      const summary = computeVoteSummary(
        [v('agree', 60), v('block', 1)],
        'consensus',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.majority_met).toBe(false)
    })

    it('majority met when no block and agree >= majority of agree+disagree', () => {
      const summary = computeVoteSummary(
        [v('agree', 40), v('disagree', 20)],
        'consensus',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.majority_met).toBe(true)
    })
  })

  describe('multiple_choice model', () => {
    it('plurality: yes = highest option count, total = all votes', () => {
      const totalAvailable = 30
      const summary = computeVoteSummary(
        [v('option_1', 10), v('option_2', 15), v('option_3', 5)],
        'multiple_choice',
        totalAvailable,
        quorum,
        majority
      )
      expect(summary.yes).toBe(15)
      expect(summary.no).toBe(15)
      expect(summary.total).toBe(30)
      expect(summary.participation_pct).toBe(1)
      expect(summary.quorum_met).toBe(true)
      expect(summary.majority_met).toBe(true)
    })

    it('majority_met when quorum met and at least one vote', () => {
      const summary = computeVoteSummary(
        [v('option_1', 60)],
        'multiple_choice',
        totalWeight,
        quorum,
        majority
      )
      expect(summary.quorum_met).toBe(true)
      expect(summary.majority_met).toBe(true)
    })
  })
})
