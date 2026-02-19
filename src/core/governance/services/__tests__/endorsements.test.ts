import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing service
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}))

vi.mock('@/shared/services/rules.service', () => ({
  getCommunityRules: () => ({
    governance: {
      min_endorsements: 3,
      endorsement_bypass_roles: ['admin', 'tesorero'],
      default_quorum: 0.5,
      default_majority: 0.5,
    },
    treasury: { mode: 'import', currency: 'MXN' },
    identity: { payment_to_vote_enabled: false },
  }),
  updateCommunityRules: vi.fn(),
}))

vi.mock('@/shared/services/email.service', () => ({
  sendEmailToMembers: vi.fn().mockResolvedValue(undefined),
}))

import { getEndorsements, addEndorsement, removeEndorsement } from '../governance.service'

describe('Endorsement System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEndorsements', () => {
    it('fetches endorsements for a proposal', async () => {
      const mockEndorsements = [
        { id: 'e1', proposal_id: 'p1', member_id: 'm1', community_id: 'c1', endorsed_at: '2025-01-01' },
        { id: 'e2', proposal_id: 'p1', member_id: 'm2', community_id: 'c1', endorsed_at: '2025-01-02' },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockEndorsements, error: null }),
          }),
        }),
      })

      const result = await getEndorsements('p1')
      expect(result).toHaveLength(2)
      expect(result[0].member_id).toBe('m1')
    })

    it('throws on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      })

      await expect(getEndorsements('p1')).rejects.toThrow()
    })
  })

  describe('addEndorsement', () => {
    it('prevents endorsing own proposal', async () => {
      // Mock getProposal
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'p1',
                status: 'draft',
                created_by: 'user1',
                endorsements_required: 3,
                endorsements_met: false,
              },
              error: null,
            }),
          }),
        }),
      })

      await expect(addEndorsement('p1', 'user1', 'c1')).rejects.toThrow(
        'No puedes avalar tu propia propuesta'
      )
    })

    it('prevents endorsing non-draft proposal', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'p1', status: 'active', created_by: 'user2', endorsements_required: 3 },
              error: null,
            }),
          }),
        }),
      })

      await expect(addEndorsement('p1', 'user1', 'c1')).rejects.toThrow(
        'Solo se pueden avalar propuestas en borrador'
      )
    })
  })

  describe('removeEndorsement', () => {
    it('calls delete on the endorsement', async () => {
      const deleteFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // First call: delete endorsement
      // Then: getProposal
      // Then: getEndorsements
      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'proposal_endorsements' && callCount === 0) {
          callCount++
          return { delete: deleteFn }
        }
        // getProposal
        if (table === 'proposals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'p1', endorsements_required: 3, endorsements_met: false },
                  error: null,
                }),
              }),
            }),
          }
        }
        // getEndorsements
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      await removeEndorsement('p1', 'm1')
      expect(deleteFn).toHaveBeenCalled()
    })
  })
})
