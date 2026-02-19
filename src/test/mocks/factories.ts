import type { User } from '@supabase/supabase-js'
import type { Member, Community } from '@/core/identity/types'
import type { Proposal } from '@/core/governance/types'
import type { Transaction } from '@/core/treasury/types'

let idCounter = 0
function nextId(prefix = 'id') {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId('user')
  return {
    id,
    app_metadata: {},
    user_metadata: { full_name: overrides.user_metadata?.full_name ?? 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email: overrides.email ?? `user-${id}@test.com`,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    session_id: nextId('session'),
    ...overrides,
  } as User
}

export function createMockCommunity(overrides: Partial<Community> = {}): Community {
  const id = overrides.id ?? nextId('community')
  return {
    id,
    name: overrides.name ?? 'Test Community',
    slug: overrides.slug ?? `community-${id}`,
    type: overrides.type ?? 'other',
    description: overrides.description,
    config: overrides.config ?? {},
    rules: overrides.rules ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    ...overrides,
  }
}

export function createMockMember(overrides: Partial<Member> = {}): Member {
  const id = overrides.id ?? nextId('member')
  return {
    id,
    community_id: overrides.community_id ?? nextId('community'),
    user_id: overrides.user_id ?? nextId('user'),
    role: overrides.role ?? 'miembro',
    status: overrides.status ?? 'active',
    financial_standing: overrides.financial_standing ?? 'good_standing',
    custom_attributes: overrides.custom_attributes ?? {},
    joined_at: overrides.joined_at ?? new Date().toISOString(),
    created_at: overrides.created_at ?? new Date().toISOString(),
    email: overrides.email ?? `member-${id}@test.com`,
    full_name: overrides.full_name ?? 'Test Member',
    ...overrides,
  }
}

export function createMockProposal(overrides: Partial<Proposal> = {}): Proposal {
  const id = overrides.id ?? nextId('proposal')
  return {
    id,
    community_id: overrides.community_id ?? nextId('community'),
    title: overrides.title ?? 'Test Proposal',
    description: overrides.description ?? 'Description',
    type: overrides.type ?? 'ordinary',
    status: overrides.status ?? 'draft',
    quorum_required: overrides.quorum_required ?? 0.5,
    majority_required: overrides.majority_required ?? 0.5,
    voting_start: overrides.voting_start ?? null,
    voting_end: overrides.voting_end ?? null,
    result: overrides.result ?? null,
    closed_at: overrides.closed_at ?? null,
    closed_by: overrides.closed_by ?? null,
    created_by: overrides.created_by ?? nextId('user'),
    created_at: overrides.created_at ?? new Date().toISOString(),
    assembly_id: overrides.assembly_id ?? null,
    discussion_start: overrides.discussion_start ?? null,
    discussion_end: overrides.discussion_end ?? null,
    discussion_min_hours: overrides.discussion_min_hours ?? null,
    outcome_declared: overrides.outcome_declared ?? null,
    outcome_declared_by: overrides.outcome_declared_by ?? null,
    outcome_declared_at: overrides.outcome_declared_at ?? null,
    grace_period_end: overrides.grace_period_end ?? null,
    appealed: overrides.appealed ?? false,
    template_id: overrides.template_id ?? null,
    voting_model: overrides.voting_model ?? 'simple',
    voting_options: overrides.voting_options ?? [{ id: 'yes', label: 'A favor' }, { id: 'no', label: 'En contra' }, { id: 'abstain', label: 'Abstención' }],
    financial_instruction: overrides.financial_instruction ?? null,
    execution_status: overrides.execution_status ?? null,
    executed_at: overrides.executed_at ?? null,
    cool_down_until: overrides.cool_down_until ?? null,
    ...overrides,
  } as Proposal
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const id = overrides.id ?? nextId('tx')
  return {
    id,
    community_id: overrides.community_id ?? nextId('community'),
    type: overrides.type ?? 'expense',
    amount: overrides.amount ?? 100,
    category_id: overrides.category_id ?? null,
    description: overrides.description ?? 'Test transaction',
    date: overrides.date ?? new Date().toISOString().split('T')[0],
    source_id: overrides.source_id ?? null,
    evidence_url: overrides.evidence_url ?? null,
    external_ref: overrides.external_ref ?? null,
    import_job_id: overrides.import_job_id ?? null,
    created_by: overrides.created_by ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
    verification_status: overrides.verification_status ?? 'reported',
    category_name: overrides.category_name,
    ...overrides,
  }
}
