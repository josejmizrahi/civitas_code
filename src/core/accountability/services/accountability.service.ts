import { supabase } from '@/shared/lib/supabase'
import type { ImplementationTask, DecisionArchiveEntry } from '../types'

// ---------------------------------------------------------------------------
// Implementation Tasks CRUD
// ---------------------------------------------------------------------------

export async function getTasks(proposalId: string): Promise<ImplementationTask[]> {
  const { data, error } = await supabase
    .from('implementation_tasks')
    .select(`
      *,
      responsible:members!responsible_member_id (id, role, user_id)
    `)
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as any[]).map((t) => ({
    ...t,
    responsible_name: null,
    responsible: undefined,
  })) as ImplementationTask[]
}

export async function getTasksByCommunity(communityId: string): Promise<ImplementationTask[]> {
  const { data, error } = await supabase
    .from('implementation_tasks')
    .select(`
      *,
      responsible:members!responsible_member_id (id, role, user_id),
      proposal:proposals!proposal_id (title)
    `)
    .eq('community_id', communityId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error

  return ((data ?? []) as any[]).map((t) => ({
    ...t,
    responsible_name: null,
    proposal_title: t.proposal?.title ?? null,
    responsible: undefined,
    proposal: undefined,
  })) as ImplementationTask[]
}

export async function createTask(task: {
  community_id: string
  proposal_id: string
  title: string
  description?: string
  responsible_member_id?: string
  due_date?: string
}): Promise<ImplementationTask> {
  const { data, error } = await supabase.from('implementation_tasks')
    .insert({
      ...task,
      status: 'pending',
      progress_pct: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as ImplementationTask
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    responsible_member_id?: string | null
    status?: string
    progress_pct?: number
    due_date?: string | null
    notes?: string
  }
): Promise<ImplementationTask> {
  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  // Auto-set completed_at when status changes to completed
  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    updateData.progress_pct = 100
  }

  const { data, error } = await supabase.from('implementation_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data as ImplementationTask
}

// ---------------------------------------------------------------------------
// Decision Archive
// ---------------------------------------------------------------------------

export async function getDecisionArchive(communityId: string): Promise<DecisionArchiveEntry[]> {
  const { data, error } = await supabase
    .from('decision_archive')
    .select('*')
    .eq('community_id', communityId)
    .order('closed_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as DecisionArchiveEntry[]
}

export async function searchDecisions(
  communityId: string,
  query: string
): Promise<DecisionArchiveEntry[]> {
  const { data, error } = await supabase.rpc('search_decisions', {
    p_community_id: communityId,
    p_query: query,
  })

  if (error) throw error
  return (data ?? []) as unknown as DecisionArchiveEntry[]
}
