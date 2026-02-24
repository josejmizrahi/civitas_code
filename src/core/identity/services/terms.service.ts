import { supabase } from '@/shared/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminTerm {
  id: string
  community_id: string
  member_id: string
  role: string
  term_start: string
  term_end: string | null
  term_number: number
  elected_in_assembly: string | null
  status: string
  created_at: string
  // Joined
  member_name?: string
}

export interface VigilanciaReport {
  id: string
  community_id: string
  author_id: string
  period: string
  report_type: string
  title: string
  content: string
  findings: Array<{ finding: string; severity: string }>
  recommendations: Array<{ recommendation: string; priority: string }>
  status: string
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  // Joined
  author_name?: string
}

// ---------------------------------------------------------------------------
// Admin Terms — LPCI CDMX Art. 42
// ---------------------------------------------------------------------------

export async function getAdminTerms(communityId: string): Promise<AdminTerm[]> {
  const { data, error } = await supabase
    .from('admin_terms')
    .select('*')
    .eq('community_id', communityId)
    .order('term_start', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminTerm[]
}

export async function getCurrentTerm(
  communityId: string,
  memberId: string,
): Promise<AdminTerm | null> {
  const { data, error } = await supabase
    .from('admin_terms')
    .select('*')
    .eq('community_id', communityId)
    .eq('member_id', memberId)
    .eq('status', 'active')
    .order('term_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as AdminTerm | null
}

export async function startTerm(
  communityId: string,
  memberId: string,
  role: string,
  assemblyId?: string,
): Promise<AdminTerm> {
  // Get last consecutive term number for this member
  const { data: lastTerm } = await supabase
    .from('admin_terms')
    .select('term_number')
    .eq('community_id', communityId)
    .eq('member_id', memberId)
    .eq('role', role)
    .in('status', ['active', 'completed'])
    .order('term_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const termNumber = lastTerm ? (lastTerm as any).term_number + 1 : 1

  // End any currently active term for this role in the community
  const { error: endError } = await supabase
    .from('admin_terms')
    .update({ status: 'completed', term_end: new Date().toISOString() })
    .eq('community_id', communityId)
    .eq('role', role)
    .eq('status', 'active')

  if (endError) throw endError

  const { data, error } = await supabase
    .from('admin_terms')
    .insert({
      community_id: communityId,
      member_id: memberId,
      role,
      term_number: termNumber,
      elected_in_assembly: assemblyId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as AdminTerm
}

export async function endTerm(termId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_terms')
    .update({
      status: 'completed',
      term_end: new Date().toISOString(),
    })
    .eq('id', termId)

  if (error) throw error
}

export async function canBeReElected(
  communityId: string,
  memberId: string,
): Promise<boolean> {
  // Get rules for max consecutive terms
  const { data: community } = await supabase
    .from('communities')
    .select('rules')
    .eq('id', communityId)
    .single()

  const maxTerms = (community as any)?.rules?.identity?.admin_max_consecutive_terms ?? 2

  // Count consecutive completed/active terms
  const { data: terms } = await supabase
    .from('admin_terms')
    .select('term_number, status')
    .eq('community_id', communityId)
    .eq('member_id', memberId)
    .in('status', ['active', 'completed'])
    .order('term_start', { ascending: false })

  if (!terms || terms.length === 0) return true

  // The highest term_number tells us the consecutive count
  const highestTermNumber = Math.max(...(terms as any[]).map((t) => t.term_number))
  return highestTermNumber < maxTerms
}

// ---------------------------------------------------------------------------
// Vigilancia Reports — LPCI CDMX Art. 45-46
// ---------------------------------------------------------------------------

export async function getVigilanciaReports(communityId: string): Promise<VigilanciaReport[]> {
  const { data, error } = await supabase
    .from('vigilancia_reports')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as VigilanciaReport[]
}

export async function createVigilanciaReport(
  communityId: string,
  data: {
    author_id: string
    period: string
    report_type: string
    title: string
    content: string
    findings: Array<{ finding: string; severity: string }>
    recommendations: Array<{ recommendation: string; priority: string }>
  },
): Promise<VigilanciaReport> {
  const { data: report, error } = await supabase
    .from('vigilancia_reports')
    .insert({
      community_id: communityId,
      author_id: data.author_id,
      period: data.period,
      report_type: data.report_type,
      title: data.title,
      content: data.content,
      findings: data.findings,
      recommendations: data.recommendations,
    })
    .select()
    .single()

  if (error) throw error
  return report as VigilanciaReport
}

export async function submitVigilanciaReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('vigilancia_reports')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) throw error
}
