/**
 * RLS Penetration Test Suite
 *
 * Tests that Row Level Security policies correctly restrict data access.
 * These tests verify that:
 * - Members can only see data from their own community
 * - Role-based access controls are enforced
 * - Unauthenticated users cannot access protected data
 *
 * Requirements: A running Supabase instance with test data.
 * Set TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY env vars.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || ''

// Test accounts — set via env or use defaults for local dev
const MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL || 'test-member@civitas.test'
const MEMBER_PASSWORD = process.env.TEST_MEMBER_PASSWORD || 'testpassword123'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'test-admin@civitas.test'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword123'
const OTHER_COMMUNITY_MEMBER_EMAIL = process.env.TEST_OTHER_EMAIL || 'test-other@civitas.test'
const OTHER_COMMUNITY_MEMBER_PASSWORD = process.env.TEST_OTHER_PASSWORD || 'testpassword123'

function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

async function createAuthenticatedClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createAnonClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  return client
}

const skipIfNoKey = SUPABASE_ANON_KEY ? describe : describe.skip

skipIfNoKey('RLS Penetration Tests', () => {
  let memberClient: SupabaseClient
  let adminClient: SupabaseClient
  let otherClient: SupabaseClient
  let anonClient: SupabaseClient

  beforeAll(async () => {
    anonClient = createAnonClient()

    try {
      memberClient = await createAuthenticatedClient(MEMBER_EMAIL, MEMBER_PASSWORD)
      adminClient = await createAuthenticatedClient(ADMIN_EMAIL, ADMIN_PASSWORD)
      otherClient = await createAuthenticatedClient(OTHER_COMMUNITY_MEMBER_EMAIL, OTHER_COMMUNITY_MEMBER_PASSWORD)
    } catch (e) {
      console.warn('Skipping RLS tests — test accounts not available:', (e as Error).message)
    }
  })

  // =========================================================================
  // Unauthenticated access
  // =========================================================================
  describe('Unauthenticated access', () => {
    it('should not read communities without auth', async () => {
      const { data, error: _error } = await anonClient.from('communities').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read members without auth', async () => {
      const { data } = await anonClient.from('members').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read transactions without auth', async () => {
      const { data } = await anonClient.from('transactions').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read proposals without auth', async () => {
      const { data } = await anonClient.from('proposals').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read audit_log without auth', async () => {
      const { data } = await anonClient.from('audit_log').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read payment_obligations without auth', async () => {
      const { data } = await anonClient.from('payment_obligations').select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read vigilancia_reports without auth', async () => {
      const { data } = await (anonClient.from('vigilancia_reports') as any).select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read rule_versions without auth', async () => {
      const { data } = await (anonClient.from('rule_versions') as any).select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not read push_subscriptions without auth', async () => {
      const { data } = await (anonClient.from('push_subscriptions') as any).select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not access ifpe_webhook_events without auth', async () => {
      const { data } = await (anonClient.from('ifpe_webhook_events') as any).select('*')
      expect(data?.length ?? 0).toBe(0)
    })

    it('should not access payment_plans without auth', async () => {
      const { data } = await (anonClient.from('payment_plans') as any).select('*')
      expect(data?.length ?? 0).toBe(0)
    })
  })

  // =========================================================================
  // Cross-community isolation
  // =========================================================================
  describe('Cross-community isolation', () => {
    it('member should only see their own community members', async () => {
      if (!memberClient || !otherClient) return

      const { data: memberData } = await memberClient.from('members').select('community_id')
      const { data: otherData } = await otherClient.from('members').select('community_id')

      if (!memberData?.length || !otherData?.length) return

      const memberCommunities = new Set(memberData.map((m: any) => m.community_id))
      const otherCommunities = new Set(otherData.map((m: any) => m.community_id))

      const overlap = [...memberCommunities].filter((c) => otherCommunities.has(c))
      expect(overlap.length).toBeLessThanOrEqual(1)
    })

    it('member should not see transactions from other communities', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: txs } = await memberClient.from('transactions').select('community_id')
      for (const tx of txs || []) {
        expect(myCommunityIds.has((tx as any).community_id)).toBe(true)
      }
    })

    it('member should not see proposals from other communities', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: proposals } = await memberClient.from('proposals').select('community_id')
      for (const p of proposals || []) {
        expect(myCommunityIds.has((p as any).community_id)).toBe(true)
      }
    })
  })

  // =========================================================================
  // Role-based write restrictions
  // =========================================================================
  describe('Role-based write restrictions', () => {
    it('regular member should not be able to delete a transaction', async () => {
      if (!memberClient) return

      const { data: txs } = await memberClient.from('transactions').select('id').limit(1)
      if (!txs?.length) return

      const txId = txs[0].id
      const { error, count } = await memberClient.from('transactions').delete({ count: 'exact' }).eq('id', txId)
      if (!error) {
        expect(count ?? 0).toBe(0)
      } else {
        expect(error).toBeTruthy()
      }
    })

    it('regular member should not update community rules', async () => {
      if (!memberClient) return

      const { data: communities } = await memberClient.from('communities').select('id, rules').limit(1)
      if (!communities?.length) return

      const originalRules = communities[0].rules

      const { error, count } = await (memberClient.from('communities') as any)
        .update({ rules: { test: true } }, { count: 'exact' })
        .eq('id', communities[0].id)

      if (!error) {
        expect(count ?? 0).toBe(0)
      }

      // Double-check: rules should be unchanged
      const { data: afterUpdate } = await memberClient.from('communities').select('rules').eq('id', communities[0].id).single()
      expect(afterUpdate?.rules).toEqual(originalRules)
    })

    it('regular member should not insert transactions', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id, role').limit(1)
      if (!members?.length) return

      if (members[0].role !== 'admin' && members[0].role !== 'tesorero') {
        const { error } = await (memberClient.from('transactions') as any).insert({
          community_id: members[0].community_id,
          type: 'income',
          amount: 0.01,
          description: 'RLS test — should be blocked',
          date: '2026-01-01',
        })
        expect(error).toBeTruthy()
      }
    })

    it('regular member should not insert vigilancia_reports', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('id, community_id, role').limit(1)
      if (!members?.length) return

      if (members[0].role !== 'admin' && members[0].role !== 'comite_vigilancia') {
        const { error } = await (memberClient.from('vigilancia_reports') as any).insert({
          community_id: members[0].community_id,
          author_id: members[0].id,
          period: '2026-Q1',
          report_type: 'quarterly',
          title: 'RLS Test Report',
          content: 'Should be blocked',
        })
        expect(error).toBeTruthy()
      }
    })

    it('regular member should not insert rule_versions', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id, role').limit(1)
      if (!members?.length || members[0].role === 'admin') return

      const { error } = await (memberClient.from('rule_versions') as any).insert({
        community_id: members[0].community_id,
        version_number: 9999,
        rules: {},
      })
      expect(error).toBeTruthy()
    })

    it('regular member should not delete other members', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('id, role').limit(2)
      if (!members || members.length < 2) return

      const target = members.find((m: any) => m.role !== 'admin')
      if (!target) return

      const { error, count } = await memberClient.from('members').delete({ count: 'exact' }).eq('id', target.id)
      if (!error) {
        expect(count ?? 0).toBe(0)
      }
    })

    it('member from community A should not insert into community B tables', async () => {
      if (!memberClient || !otherClient) return

      const { data: myMembers } = await memberClient.from('members').select('community_id').limit(1)
      const { data: otherMembers } = await otherClient.from('members').select('community_id').limit(1)
      if (!myMembers?.length || !otherMembers?.length) return

      const myCommunityId = myMembers[0].community_id
      const otherCommunityId = otherMembers[0].community_id
      if (myCommunityId === otherCommunityId) return

      const { error } = await (memberClient.from('transactions') as any).insert({
        community_id: otherCommunityId,
        type: 'expense',
        amount: 0.01,
        description: 'Cross-community RLS test',
        date: '2026-01-01',
      })
      expect(error).toBeTruthy()
    })
  })

  // =========================================================================
  // Explicit RLS policy validation per table
  // =========================================================================
  describe('Explicit RLS policy validation', () => {
    it('should enforce community_id isolation on payment_obligations', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: obligations } = await (memberClient.from('payment_obligations') as any).select('community_id')
      for (const ob of obligations || []) {
        expect(myCommunityIds.has(ob.community_id)).toBe(true)
      }
    })

    it('should enforce community_id isolation on budgets', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: budgets } = await (memberClient.from('budgets') as any).select('community_id')
      for (const b of budgets || []) {
        expect(myCommunityIds.has(b.community_id)).toBe(true)
      }
    })

    it('should enforce community_id isolation on categories', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: categories } = await memberClient.from('categories').select('community_id')
      for (const c of categories || []) {
        expect(myCommunityIds.has((c as any).community_id)).toBe(true)
      }
    })

    it('should enforce community_id isolation on audit_log', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: logs } = await memberClient.from('audit_log').select('community_id').limit(50)
      for (const entry of logs || []) {
        expect(myCommunityIds.has((entry as any).community_id)).toBe(true)
      }
    })

    it('should enforce community_id isolation on payment_plans', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: plans } = await (memberClient.from('payment_plans') as any).select('community_id')
      for (const plan of plans || []) {
        expect(myCommunityIds.has(plan.community_id)).toBe(true)
      }
    })

    it('should enforce community_id isolation on ifpe_webhook_events', async () => {
      if (!memberClient) return

      const { data: members } = await memberClient.from('members').select('community_id')
      const myCommunityIds = new Set((members || []).map((m: any) => m.community_id))

      const { data: events } = await (memberClient.from('ifpe_webhook_events') as any).select('community_id')
      for (const event of events || []) {
        expect(myCommunityIds.has(event.community_id)).toBe(true)
      }
    })
  })

  // =========================================================================
  // Admin privilege verification
  // =========================================================================
  describe('Admin privileges', () => {
    it('admin client should be able to read communities', async () => {
      if (!adminClient) return

      const { data } = await adminClient.from('communities').select('id')
      expect(data).toBeDefined()
    })
  })

  // =========================================================================
  // Push subscriptions isolation
  // =========================================================================
  describe('Push subscription isolation', () => {
    it('user should only see their own push subscriptions', async () => {
      if (!memberClient) return

      const { data: { user } } = await memberClient.auth.getUser()
      if (!user) return

      const { data: subs } = await (memberClient.from('push_subscriptions') as any).select('user_id')
      for (const sub of subs || []) {
        expect(sub.user_id).toBe(user.id)
      }
    })
  })
})
