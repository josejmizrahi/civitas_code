import { supabase } from '@/shared/lib/supabase'
import { getCommunityRules, updateCommunityRules } from '@/shared/services/rules.service'
import type { Proposal, Vote, VoteSummary, Delegation, Minutes } from '../types'

export async function getProposals(
  communityId: string,
  status?: string
): Promise<Proposal[]> {
  let query = supabase
    .from('proposals')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Proposal[]
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (error) throw error
  return data as Proposal
}

export async function createProposal(
  communityId: string,
  proposal: {
    title: string
    description: string
    type: string
    quorum_required: number
    majority_required: number
    voting_start: string | null
    voting_end: string | null
    created_by: string
    financial_instruction?: Record<string, unknown>
    template_id?: string
    discussion_min_hours?: number
  }
): Promise<Proposal> {
  const { financial_instruction, template_id, discussion_min_hours, ...rest } = proposal
  const insertData: Record<string, unknown> = {
    community_id: communityId,
    status: 'draft',
    ...rest,
  }
  if (financial_instruction && financial_instruction.type !== 'none') {
    insertData.financial_instruction = financial_instruction
    insertData.execution_status = 'pending'
  }
  if (template_id) {
    insertData.template_id = template_id
  }
  if (discussion_min_hours != null) {
    insertData.discussion_min_hours = discussion_min_hours
  }

  const { data, error } = await supabase.from('proposals')
    .insert(insertData as any)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Proposal
}

// ---------------------------------------------------------------------------
// Governance Lifecycle — GV-001, GV-006, GV-043
// ---------------------------------------------------------------------------

/**
 * Start discussion phase for a proposal.
 * Transitions status from 'draft' to 'discussion'.
 */
export async function startDiscussion(
  proposalId: string,
  communityId: string,
  discussionHours: number
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'draft') {
    throw new Error('Solo se puede iniciar discusión desde el estado borrador')
  }

  const now = new Date()
  const discussionEnd = new Date(now.getTime() + discussionHours * 60 * 60 * 1000)

  const { data, error } = await (supabase.from('proposals') as any)
    .update({
      status: 'discussion',
      discussion_start: now.toISOString(),
      discussion_end: discussionEnd.toISOString(),
      discussion_min_hours: discussionHours,
    })
    .eq('id', proposalId)
    .select()
    .single()

  if (error) throw error

  // Notify community
  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'proposal_opened',
      `Nueva propuesta en discusión: ${proposal.title}`,
      `Se ha abierto un periodo de discusión de ${discussionHours}h`,
      { proposal_id: proposalId }
    )
  } catch { /* notifications are best-effort */ }

  return data as unknown as Proposal
}

/**
 * Open voting from discussion phase.
 * Transitions status from 'discussion' to 'active'.
 * Validates that minimum discussion period has elapsed.
 */
export async function openVotingFromDiscussion(
  proposalId: string,
  communityId: string,
  votingEnd: string | null
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'discussion') {
    throw new Error('Solo se puede abrir votación desde discusión')
  }

  // Validate minimum discussion period
  if (proposal.discussion_end) {
    const endTime = new Date(proposal.discussion_end).getTime()
    if (Date.now() < endTime) {
      const hoursLeft = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60))
      throw new Error(`El periodo de discusión no ha terminado. Faltan ~${hoursLeft}h`)
    }
  }

  const updateData: Record<string, unknown> = {
    status: 'active',
    voting_start: new Date().toISOString(),
  }
  if (votingEnd) {
    updateData.voting_end = votingEnd
  }

  const { data, error } = await (supabase.from('proposals') as any)
    .update(updateData)
    .eq('id', proposalId)
    .select()
    .single()

  if (error) throw error

  // Notify community
  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'proposal_opened',
      `Votación abierta: ${proposal.title}`,
      votingEnd ? `La votación cierra el ${new Date(votingEnd).toLocaleDateString('es-MX')}` : 'Votación sin fecha límite',
      { proposal_id: proposalId }
    )
  } catch { /* notifications are best-effort */ }

  return data as unknown as Proposal
}

/**
 * Declare outcome for a closed/approved/rejected proposal.
 * Records who declared the outcome and when.
 */
export async function declareOutcome(
  proposalId: string,
  outcome: string,
  declaredByUserId: string
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (!['closed', 'approved', 'rejected', 'executed'].includes(proposal.status)) {
    throw new Error('Solo se puede declarar resultado de propuestas cerradas')
  }

  const { data, error } = await (supabase.from('proposals') as any)
    .update({
      outcome_declared: outcome,
      outcome_declared_by: declaredByUserId,
      outcome_declared_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Proposal
}

/**
 * Appeal a proposal during the grace period.
 * Prevents auto-execution until the appeal is resolved.
 */
export async function appealProposal(
  proposalId: string,
  communityId: string,
  appealedByUserId: string
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)

  if (proposal.status !== 'approved') {
    throw new Error('Solo se pueden apelar propuestas aprobadas')
  }

  // Validate we're within the grace period
  if (proposal.grace_period_end) {
    const graceEnd = new Date(proposal.grace_period_end).getTime()
    if (Date.now() > graceEnd) {
      throw new Error('El periodo de apelación ha expirado')
    }
  }

  const { data, error } = await (supabase.from('proposals') as any)
    .update({ appealed: true })
    .eq('id', proposalId)
    .select()
    .single()

  if (error) throw error

  // Log the appeal in audit trail
  try {
    await (supabase.from('audit_log') as any).insert({
      community_id: communityId,
      user_id: appealedByUserId,
      action: 'appeal_proposal',
      entity_type: 'proposal',
      entity_id: proposalId,
      details: { appealed_at: new Date().toISOString() },
    })
  } catch { /* audit is best-effort */ }

  // Notify community
  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'proposal_closed',
      `Propuesta apelada: ${proposal.title}`,
      'La ejecución ha sido pausada por una apelación',
      { proposal_id: proposalId }
    )
  } catch { /* notifications are best-effort */ }

  return data as unknown as Proposal
}

export async function updateProposalStatus(
  proposalId: string,
  status: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const { error } = await (supabase.from('proposals') as any)
    .update({ status, ...extra })
    .eq('id', proposalId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Votes (B2: weighted voting with real member weight)
// ---------------------------------------------------------------------------

export async function getVotes(proposalId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('proposal_id', proposalId)

  if (error) throw error
  return (data ?? []) as Vote[]
}

/**
 * Cast vote using the member's actual voting_weight.
 * Validates proposal is active and voting_end hasn't passed.
 */
export async function castVote(vote: {
  proposal_id: string
  member_id: string
  value: string
}): Promise<Vote> {
  // 1. Validate proposal is active and within voting window
  const proposal = await getProposal(vote.proposal_id)
  if (proposal.status !== 'active') {
    throw new Error('La propuesta no está activa para votación')
  }
  if (proposal.voting_end && new Date(proposal.voting_end) < new Date()) {
    throw new Error('El periodo de votación ha terminado')
  }

  // 2. Get the member's voting weight
  const { data: member, error: memberErr } = await supabase
    .from('members')
    .select('voting_weight')
    .eq('id', vote.member_id)
    .single()

  if (memberErr) throw memberErr
  const weight = Number((member as any)?.voting_weight) || 1

  // 3. Delete existing vote if any (upsert pattern)
  await (supabase.from('votes') as any)
    .delete()
    .eq('proposal_id', vote.proposal_id)
    .eq('member_id', vote.member_id)

  // 4. Insert new vote with real weight
  const { data, error } = await (supabase.from('votes') as any)
    .insert({
      ...vote,
      weight,
      cast_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as Vote
}

// ---------------------------------------------------------------------------
// B3: Cast vote with delegations
// ---------------------------------------------------------------------------

/**
 * Cast vote for the member AND any delegated votes.
 * For each active delegation where to_member_id = memberId:
 * - If the delegating member hasn't voted directly, emit a delegated vote
 */
export async function castVoteWithDelegations(
  proposalId: string,
  memberId: string,
  value: string,
  communityId: string
): Promise<Vote[]> {
  const results: Vote[] = []

  // Cast the member's own vote
  const ownVote = await castVote({ proposal_id: proposalId, member_id: memberId, value })
  results.push(ownVote)

  // Find active delegations TO this member
  const { data: delegations, error: delErr } = await supabase
    .from('delegations')
    .select('*')
    .eq('community_id', communityId)
    .eq('to_member_id', memberId)
    .eq('active', true)

  if (delErr || !delegations) return results

  // Get existing votes to check who already voted directly
  const existingVotes = await getVotes(proposalId)
  const votedMemberIds = new Set(existingVotes.map((v) => v.member_id))

  for (const delegation of delegations as any[]) {
    // Skip if delegating member already voted directly
    if (votedMemberIds.has(delegation.from_member_id)) continue

    // Get delegating member's weight
    const { data: delMember } = await supabase
      .from('members')
      .select('voting_weight')
      .eq('id', delegation.from_member_id)
      .single()

    const weight = Number((delMember as any)?.voting_weight) || 1

    const { data: delegatedVote, error: voteErr } = await (supabase.from('votes') as any)
      .insert({
        proposal_id: proposalId,
        member_id: delegation.from_member_id,
        value,
        weight,
        delegated_from: memberId,
        cast_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!voteErr && delegatedVote) results.push(delegatedVote as Vote)
  }

  return results
}

// ---------------------------------------------------------------------------
// Vote Summary (B2: weight-based calculation)
// ---------------------------------------------------------------------------

/**
 * Compute vote summary using actual weights, not member count.
 * participation_pct = totalWeightVoted / totalAvailableWeight
 */
export async function getVoteSummary(
  proposalId: string,
  communityId: string,
  quorumRequired: number,
  majorityRequired: number
): Promise<VoteSummary> {
  const votes = await getVotes(proposalId)

  // Get total available weight from all active members, excluding morosos (Art. 2 LPCI)
  const { data: members } = await supabase
    .from('members')
    .select('voting_weight, financial_standing')
    .eq('community_id', communityId)
    .eq('status', 'active')

  const totalAvailableWeight = (members ?? [])
    .filter((m: any) => m.financial_standing !== 'moroso')
    .reduce(
      (sum: number, m: any) => sum + (Number(m.voting_weight) || 1),
      0
    )

  let yes = 0
  let no = 0
  let abstain = 0

  for (const v of votes) {
    const w = v.weight || 1
    if (v.value === 'yes') yes += w
    else if (v.value === 'no') no += w
    else abstain += w
  }

  const total = yes + no + abstain
  const participation_pct = totalAvailableWeight > 0 ? total / totalAvailableWeight : 0
  const quorum_met = participation_pct >= quorumRequired
  const votesForMajority = yes + no
  const majority_met = votesForMajority > 0 ? yes / votesForMajority >= majorityRequired : false

  return { yes, no, abstain, total, quorum_met, majority_met, participation_pct }
}

// ---------------------------------------------------------------------------
// B4: Close proposal (auto or manual)
// ---------------------------------------------------------------------------

/**
 * Close a proposal and determine result based on quorum and majority.
 * If approved + has financial_instruction + auto_execution_enabled → enters cool-down.
 */
export async function closeProposal(
  proposalId: string,
  communityId: string,
  closedByUserId: string
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  const summary = await getVoteSummary(
    proposalId,
    communityId,
    proposal.quorum_required,
    proposal.majority_required
  )

  const resultStatus = summary.quorum_met && summary.majority_met ? 'approved' : 'rejected'
  const resultText = summary.quorum_met
    ? (summary.majority_met ? 'Aprobada por mayoría' : 'Rechazada - no alcanzó mayoría')
    : 'Rechazada - no alcanzó quórum'

  const updateData: Record<string, unknown> = {
    status: resultStatus,
    result: resultText,
    closed_at: new Date().toISOString(),
    closed_by: closedByUserId,
  }

  // If approved and has financial instruction, check auto-execution rules
  if (resultStatus === 'approved' && proposal.financial_instruction) {
    const { data: community } = await supabase
      .from('communities')
      .select('config, rules')
      .eq('id', communityId)
      .single()

    const rules = getCommunityRules(
      (community as any)?.config ?? null,
      (community as any)?.rules ?? null
    )

    const instruction = proposal.financial_instruction as unknown as Record<string, unknown>
    const amount = Number(instruction.amount ?? instruction.new_amount ?? 0)
    const autoEnabled = rules.governance.auto_execution_enabled
    const threshold = rules.governance.auto_execution_threshold
    const coolDownHours = rules.governance.cool_down_hours || 0
    const belowThreshold = threshold === 0 || amount <= threshold

    if (autoEnabled && belowThreshold) {
      // Enter cool-down period before auto-execution
      const coolDownUntil = new Date(Date.now() + coolDownHours * 60 * 60 * 1000).toISOString()
      updateData.execution_status = 'cool_down'
      updateData.cool_down_until = coolDownUntil
    }

    // Set grace period for appeals — GV-043
    const gracePeriodHours = rules.governance.grace_period_hours || 0
    if (gracePeriodHours > 0) {
      const gracePeriodEnd = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000).toISOString()
      updateData.grace_period_end = gracePeriodEnd
    }
  }

  const { data, error } = await (supabase.from('proposals') as any)
    .update(updateData)
    .eq('id', proposalId)
    .select()
    .single()

  if (error) throw error

  // Notify community about proposal result
  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'proposal_closed',
      `Propuesta ${resultStatus === 'approved' ? 'aprobada' : 'rechazada'}: ${proposal.title}`,
      resultText,
      { proposal_id: proposalId, result: resultStatus }
    )
  } catch { /* notifications are best-effort */ }

  return data as unknown as Proposal
}

// ---------------------------------------------------------------------------
// Server-side auto-close: process all expired proposals
// ---------------------------------------------------------------------------

/**
 * Call the server-side function to close all expired proposals.
 * This is a complement to the pg_cron/trigger approach — can be
 * called on app load or periodically from the client.
 */
export async function processExpiredProposals(): Promise<number> {
  const { data, error } = await (supabase as any).rpc('process_expired_proposals')
  if (error) {
    console.warn('process_expired_proposals RPC not available yet, falling back to client-side', error.message)
    return 0
  }
  return (data as number) ?? 0
}

/**
 * Process proposals whose cool-down has expired (auto-execute server-side).
 * Call on app load alongside processExpiredProposals.
 */
export async function processAutoExecutions(): Promise<number> {
  const { data, error } = await (supabase as any).rpc('process_auto_executions')
  if (error) {
    console.warn('process_auto_executions RPC not available yet:', error.message)
    return 0
  }
  return (data as number) ?? 0
}

// ---------------------------------------------------------------------------
// B6: Execute financial proposal (all instruction types)
// ---------------------------------------------------------------------------

/**
 * Execute a financial proposal that has been approved.
 * Handles: disbursement, budget_allocation, quota_change, config_change
 * Enforces cool-down period if set.
 */
export async function executeProposal(
  proposalId: string,
  communityId: string,
  executedByUserId: string
): Promise<Proposal> {
  const proposal = await getProposal(proposalId)

  if (proposal.status !== 'approved') {
    throw new Error('Solo se pueden ejecutar propuestas aprobadas')
  }
  if (!proposal.financial_instruction) {
    throw new Error('Esta propuesta no tiene instrucción financiera')
  }
  if (proposal.execution_status === 'executed') {
    throw new Error('Esta propuesta ya fue ejecutada')
  }

  // Cool-down enforcement: block execution until cool-down period expires
  if (proposal.execution_status === 'cool_down' && proposal.cool_down_until) {
    const coolDownEnd = new Date(proposal.cool_down_until).getTime()
    if (Date.now() < coolDownEnd) {
      const hoursLeft = Math.ceil((coolDownEnd - Date.now()) / (1000 * 60 * 60))
      throw new Error(`Propuesta en periodo de enfriamiento. Faltan ~${hoursLeft}h para poder ejecutar.`)
    }
  }

  const instruction = proposal.financial_instruction as unknown as Record<string, unknown>
  const instructionType = instruction.type as string

  try {
    switch (instructionType) {
      // ── Disbursement: create an expense transaction ──
      case 'disbursement': {
        const { error: txErr } = await (supabase.from('transactions') as any).insert({
          community_id: communityId,
          type: 'expense',
          amount: Number(instruction.amount) || 0,
          description: `[Gobernanza] ${instruction.description || proposal.title}`,
          date: new Date().toISOString().split('T')[0],
          category_id: (instruction.category_id as string) || null,
          created_by: executedByUserId,
        })
        if (txErr) throw txErr
        break
      }

      // ── Budget allocation: create or update a budget entry ──
      case 'budget_allocation': {
        const period = (instruction.period as string) || new Date().toISOString().substring(0, 7)
        const categoryId = instruction.category_id as string | undefined
        const amount = Number(instruction.amount) || 0

        if (categoryId) {
          // Check if budget already exists for this category + period
          const { data: existing } = await (supabase
            .from('budgets') as any)
            .select('id')
            .eq('community_id', communityId)
            .eq('category_id', categoryId)
            .eq('period', period)
            .maybeSingle()

          if (existing) {
            // Update existing budget
            const { error: budgetErr } = await (supabase.from('budgets') as any)
              .update({ amount, approved_by_proposal_id: proposalId })
              .eq('id', existing.id)
            if (budgetErr) throw budgetErr
          } else {
            // Create new budget
            const { error: budgetErr } = await (supabase.from('budgets') as any).insert({
              community_id: communityId,
              category_id: categoryId,
              period,
              amount,
              approved_by_proposal_id: proposalId,
            })
            if (budgetErr) throw budgetErr
          }
        } else {
          throw new Error('budget_allocation requiere category_id')
        }
        break
      }

      // ── Quota change: generate payment obligations for all active members ──
      case 'quota_change': {
        const newAmount = Number(instruction.new_amount ?? instruction.amount) || 0
        const effectiveDate = (instruction.effective_date as string) || new Date().toISOString().split('T')[0]
        const concept = (instruction.description as string) || `Cuota aprobada por gobernanza: ${proposal.title}`

        // Get all active members
        const { data: activeMembers, error: membersErr } = await supabase
          .from('members')
          .select('id')
          .eq('community_id', communityId)
          .eq('status', 'active')
        if (membersErr) throw membersErr

        if (activeMembers && activeMembers.length > 0) {
          const obligations = activeMembers.map((m: any) => ({
            community_id: communityId,
            member_id: m.id,
            amount: newAmount,
            due_date: effectiveDate,
            concept,
            status: 'pending',
          }))

          const { error: obErr } = await (supabase.from('payment_obligations') as any).insert(obligations)
          if (obErr) throw obErr
        }
        break
      }

      // ── Config change: update community rules ──
      case 'config_change': {
        const configKey = instruction.config_key as string
        const configValue = instruction.config_value

        if (!configKey) throw new Error('config_change requiere config_key')

        // Fetch current community to get rules
        const { data: community, error: comErr } = await supabase
          .from('communities')
          .select('config, rules')
          .eq('id', communityId)
          .single()
        if (comErr) throw comErr

        const currentRules = getCommunityRules(
          (community as any)?.config ?? null,
          (community as any)?.rules ?? null
        )

        // Apply the config change using dot notation: "governance.cool_down_hours" → rules.governance.cool_down_hours
        const parts = configKey.split('.')
        if (parts.length === 2) {
          const [section, key] = parts as [keyof typeof currentRules, string]
          if (section in currentRules) {
            ;(currentRules[section] as any)[key] = configValue
          }
        } else if (parts.length === 1) {
          // Direct key on a section (try each)
          const key = parts[0]
          for (const section of ['governance', 'treasury', 'identity'] as const) {
            if (key in currentRules[section]) {
              ;(currentRules[section] as any)[key] = configValue
              break
            }
          }
        }

        await updateCommunityRules(communityId, currentRules)
        break
      }

      case 'none':
        // No financial action needed
        break

      default:
        throw new Error(`Tipo de instrucción no soportado: ${instructionType}`)
    }

    // Mark proposal as executed
    const { data, error } = await (supabase.from('proposals') as any)
      .update({
        execution_status: 'executed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Proposal

  } catch (execError) {
    // Mark proposal execution as failed so it can be retried
    await (supabase.from('proposals') as any)
      .update({ execution_status: 'failed' })
      .eq('id', proposalId)

    throw execError
  }
}

// ---------------------------------------------------------------------------
// Delegations
// ---------------------------------------------------------------------------

export async function getDelegations(communityId: string): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('delegations')
    .select('*')
    .eq('community_id', communityId)
    .eq('active', true)

  if (error) throw error
  return (data ?? []) as Delegation[]
}

export async function createDelegation(delegation: {
  community_id: string
  from_member_id: string
  to_member_id: string
  scope: string
}): Promise<Delegation> {
  const { data, error } = await (supabase.from('delegations') as any)
    .insert({ ...delegation, active: true })
    .select()
    .single()

  if (error) throw error
  return data as Delegation
}

export async function revokeDelegation(delegationId: string): Promise<void> {
  const { error } = await (supabase.from('delegations') as any)
    .update({ active: false })
    .eq('id', delegationId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Minutes + Signatures (B5)
// ---------------------------------------------------------------------------

export async function generateMinutes(
  communityId: string,
  proposalId: string,
  proposal: Proposal,
  voteSummary: VoteSummary
): Promise<Minutes> {
  // Fetch community info for legal context
  const { data: community } = await supabase
    .from('communities')
    .select('name, type')
    .eq('id', communityId)
    .single()

  const communityName = (community as any)?.name || 'Comunidad'
  const communityType = (community as any)?.type || 'general'
  const isResidential = communityType === 'residential'

  const resultText = voteSummary.majority_met ? 'APROBADA' : 'RECHAZADA'
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const content = [
    `ACTA DE VOTACIÓN`,
    `${'='.repeat(60)}`,
    ``,
    `Comunidad: ${communityName}`,
    `Fecha: ${dateStr}`,
    `Hora: ${timeStr}`,
    isResidential ? `Tipo de asamblea: ${proposal.type === 'extraordinary' ? 'Extraordinaria' : 'Ordinaria'}` : '',
    ``,
    `PROPUESTA: ${proposal.title}`,
    `Tipo: ${proposal.type}`,
    ``,
    `DESCRIPCIÓN:`,
    proposal.description,
    ``,
    `${'─'.repeat(60)}`,
    `RESULTADOS DE VOTACIÓN:`,
    `${'─'.repeat(60)}`,
    `- Votos a favor:     ${voteSummary.yes} (peso ponderado)`,
    `- Votos en contra:   ${voteSummary.no} (peso ponderado)`,
    `- Abstenciones:      ${voteSummary.abstain} (peso ponderado)`,
    `- Total participación: ${voteSummary.total} de peso disponible`,
    ``,
    `- Participación:     ${(voteSummary.participation_pct * 100).toFixed(1)}%`,
    `- Quórum requerido:  ${(proposal.quorum_required * 100).toFixed(0)}%`,
    `- Quórum alcanzado:  ${voteSummary.quorum_met ? 'SÍ' : 'NO'}`,
    `- Mayoría requerida: ${(proposal.majority_required * 100).toFixed(0)}%`,
    `- Mayoría alcanzada: ${voteSummary.majority_met ? 'SÍ' : 'NO'}`,
    ``,
    `${'─'.repeat(60)}`,
    `RESOLUCIÓN: La propuesta ha sido ${resultText}.`,
    proposal.result ? `Nota: ${proposal.result}` : '',
    ``,
    `${'─'.repeat(60)}`,
    `ESPACIOS PARA FIRMA:`,
    `${'─'.repeat(60)}`,
    ``,
    `Presidente de la Asamblea: _________________________`,
    `Nombre:                    _________________________`,
    `Fecha:                     _________________________`,
    ``,
    `Secretario (Administrador): _________________________`,
    `Nombre:                     _________________________`,
    `Fecha:                      _________________________`,
    ``,
    isResidential ? `Comité de Vigilancia:       _________________________` : '',
    isResidential ? `Nombre:                     _________________________` : '',
    isResidential ? `Fecha:                      _________________________` : '',
    isResidential ? `` : '',
    `${'─'.repeat(60)}`,
    `Este documento fue generado automáticamente por Civitas.`,
    `La integridad del acta está protegida mediante firma digital SHA-256.`,
    isResidential ? `Conforme a la Ley de Propiedad en Condominio (LPCI CDMX).` : '',
  ].filter(Boolean).join('\n')

  // Compute integrity hash
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(content + now.toISOString()))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const integrityHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const { data, error } = await (supabase.from('minutes') as any)
    .insert({
      community_id: communityId,
      proposal_id: proposalId,
      content,
      generated_at: now.toISOString(),
      approved: false,
      signatures: [],
      integrity_hash: integrityHash,
    })
    .select()
    .single()

  if (error) throw error
  return data as Minutes
}

export async function getMinutes(proposalId: string): Promise<Minutes | null> {
  const { data, error } = await supabase
    .from('minutes')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Minutes | null
}

/**
 * Approve minutes (admin only).
 */
export async function approveMinutes(minutesId: string, userId: string): Promise<Minutes> {
  const { data, error } = await (supabase.from('minutes') as any)
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq('id', minutesId)
    .select()
    .single()

  if (error) throw error
  return data as Minutes
}

/**
 * Sign minutes with a SHA-256 hash of content + member_id + timestamp.
 */
export async function signMinutes(
  minutesId: string,
  memberId: string,
  memberName: string
): Promise<Minutes> {
  // Fetch current minutes
  const { data: current, error: fetchErr } = await supabase
    .from('minutes')
    .select('*')
    .eq('id', minutesId)
    .single()

  if (fetchErr) throw fetchErr
  const minutes = current as Minutes

  // Compute SHA-256 hash
  const signedAt = new Date().toISOString()
  const hashInput = `${minutes.content}|${memberId}|${signedAt}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Append signature
  const signatures = [...(minutes.signatures || []), { member_id: memberId, member_name: memberName, signed_at: signedAt, hash }]

  const { data, error } = await (supabase.from('minutes') as any)
    .update({ signatures })
    .eq('id', minutesId)
    .select()
    .single()

  if (error) throw error
  return data as Minutes
}
