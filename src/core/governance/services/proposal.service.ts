import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import { AppError } from '@/shared/lib/errors'
import { assertCanPerformAction, getCommunityRules, updateCommunityRules } from '@/shared/services/rules.service'
import { sendEmailToMembers } from '@/shared/services/email.service'
import { sendPushToMembers } from '@/shared/services/push-notification.service'
import type { Proposal } from '../types'
import { getEndorsements } from './endorsement.service'
import { getVotes, getVoteSummary } from './vote.service'

async function getActiveMemberIds(communityId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('community_id', communityId)
    .eq('status', 'active')
  if (error || !data) return []
  return (data as Array<{ id: string }>).map((m) => m.id)
}

export async function getProposals(communityId: string, status?: string): Promise<Proposal[]> {
  let query = supabase
    .from('proposals')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (status) {
    if (status === 'closed') {
      query = query.in('status', ['closed', 'approved', 'rejected', 'executed'])
    } else {
      query = query.eq('status', status)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Proposal[]
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (error) throw error
  return data as unknown as Proposal
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
    voting_model?: string
    voting_options?: { id: string; label: string }[]
  }
): Promise<Proposal> {
  const { data: community } = await supabase
    .from('communities')
    .select('config, rules')
    .eq('id', communityId)
    .single()

  const communityRow = community as { config?: Record<string, unknown>; rules?: Record<string, unknown> } | null
  const rules = getCommunityRules(communityRow?.config ?? null, communityRow?.rules ?? null)

  const { data: creatorMember } = await supabase
    .from('members')
    .select('id, role')
    .eq('community_id', communityId)
    .eq('user_id', proposal.created_by)
    .single()

  const creator = creatorMember as { id?: string; role?: string } | null
  if (!creator?.id) {
    throw new AppError('No se encontr? al miembro creador en la comunidad activa.', 'NOT_FOUND')
  }
  await assertCanPerformAction(communityId, creator.id, 'create_proposal')

  const creatorRole = creator.role ?? 'miembro'
  const bypassRoles = rules.governance.endorsement_bypass_roles ?? ['admin', 'tesorero']
  const canBypass = bypassRoles.includes(creatorRole)
  const minEndorsements = rules.governance.min_endorsements ?? 0
  const endorsementsRequired = (canBypass || minEndorsements === 0) ? 0 : minEndorsements

  const { financial_instruction, template_id, discussion_min_hours, voting_model, voting_options, ...rest } = proposal
  const insertData: Record<string, unknown> = {
    community_id: communityId,
    status: 'draft',
    endorsements_required: endorsementsRequired,
    endorsements_met: endorsementsRequired === 0,
    ...rest,
  }
  if (financial_instruction && financial_instruction.type !== 'none') {
    insertData.financial_instruction = financial_instruction
    insertData.execution_status = 'pending'
  }
  if (template_id) insertData.template_id = template_id
  if (discussion_min_hours != null) insertData.discussion_min_hours = discussion_min_hours
  if (voting_model) insertData.voting_model = voting_model
  if (voting_options && voting_options.length > 0) insertData.voting_options = voting_options

  const { data, error } = await supabase.from('proposals')
    .insert(insertData as any)
    .select()
    .single()

  if (error) {
    logger.error('Supabase proposals INSERT error:', { code: error.code, message: error.message, details: (error as { details?: unknown }).details, hint: (error as { hint?: unknown }).hint })
    throw new Error(error.message || 'Error al insertar propuesta')
  }

  const created = data as unknown as Proposal

  if (endorsementsRequired === 0) {
    void import('@/shared/services/notification.service')
      .then(({ notifyCommunity }) =>
        notifyCommunity(
          communityId,
          'proposal_new',
          `Nueva propuesta: ${created.title}`,
          created.description || 'Se cre? una propuesta nueva.',
          { proposal_id: created.id },
        ),
      )
      .catch(() => {})
    void getActiveMemberIds(communityId)
      .then((memberIds) =>
        sendPushToMembers(
          memberIds,
          `Nueva propuesta: ${created.title}`,
          'Hay una nueva propuesta disponible para revisi?n.',
          { proposal_id: created.id },
        ),
      )
      .catch(() => {})
    sendEmailToMembers(communityId, 'proposal_new', {
      title: created.title,
      description: created.description,
      proposal_type: created.type,
      author_name: proposal.created_by,
      proposal_id: created.id,
      community_name: communityId,
      app_url: window.location.origin,
    }).catch(() => {})
  }

  return created
}

export async function startDiscussion(proposalId: string, communityId: string, discussionHours: number): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'draft') throw new AppError('Solo se puede iniciar discusi?n desde el estado borrador', 'VALIDATION')

  if (proposal.endorsements_required > 0 && !proposal.endorsements_met) {
    const endorsements = await getEndorsements(proposalId)
    if (endorsements.length < proposal.endorsements_required) {
      throw new Error(`Se requieren ${proposal.endorsements_required} avales para avanzar. Tiene ${endorsements.length}.`)
    }
  }

  const now = new Date()
  const discussionEnd = new Date(now.getTime() + discussionHours * 60 * 60 * 1000)

  const { data, error } = await supabase.from('proposals')
    .update({ status: 'discussion', discussion_start: now.toISOString(), discussion_end: discussionEnd.toISOString(), discussion_min_hours: discussionHours })
    .eq('id', proposalId).select().single()
  if (error) throw error

  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(communityId, 'proposal_opened', `Nueva propuesta en discusi?n: ${proposal.title}`, `Se ha abierto un periodo de discusi?n de ${discussionHours}h`, { proposal_id: proposalId })
  } catch { /* best-effort */ }

  return data as unknown as Proposal
}

export async function openVotingFromDiscussion(proposalId: string, communityId: string, votingEnd: string | null): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'discussion') throw new AppError('Solo se puede abrir votaci?n desde discusi?n', 'VALIDATION')

  if (proposal.discussion_end) {
    const endTime = new Date(proposal.discussion_end).getTime()
    if (Date.now() < endTime) {
      const hoursLeft = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60))
      throw new Error(`El periodo de discusi?n no ha terminado. Faltan ~${hoursLeft}h`)
    }
  }

  const updateData: Record<string, unknown> = { status: 'active', voting_start: new Date().toISOString() }
  if (votingEnd) updateData.voting_end = votingEnd

  const { data, error } = await supabase.from('proposals').update(updateData).eq('id', proposalId).select().single()
  if (error) throw error

  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(communityId, 'proposal_opened', `Votaci?n abierta: ${proposal.title}`, votingEnd ? `La votaci?n cierra el ${new Date(votingEnd).toLocaleDateString('es-MX')}` : 'Votaci?n sin fecha l?mite', { proposal_id: proposalId })
    const memberIds = await getActiveMemberIds(communityId)
    void sendPushToMembers(
      memberIds,
      `Votaci?n abierta: ${proposal.title}`,
      votingEnd ? `La votaci?n cierra el ${new Date(votingEnd).toLocaleDateString('es-MX')}.` : 'La votaci?n ya est? abierta.',
      { proposal_id: proposalId },
    )
    const { sendEmailToMembers } = await import('@/shared/services/email.service')
    const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
    sendEmailToMembers(communityId, 'voting_opened', {
      title: proposal.title,
      app_url: appUrl,
      proposal_id: proposalId,
      voting_end: votingEnd ? new Date(votingEnd).toLocaleDateString('es-MX') : null,
    })
  } catch { /* best-effort */ }

  return data as unknown as Proposal
}

export async function declareOutcome(proposalId: string, outcome: string, declaredByUserId: string): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (!['closed', 'approved', 'rejected', 'executed'].includes(proposal.status)) throw new Error('Solo se puede declarar resultado de propuestas cerradas')

  const { data, error } = await supabase.from('proposals')
    .update({ outcome_declared: outcome, outcome_declared_by: declaredByUserId, outcome_declared_at: new Date().toISOString() })
    .eq('id', proposalId).select().single()
  if (error) throw error
  return data as unknown as Proposal
}

export async function appealProposal(proposalId: string, communityId: string, appealedByUserId: string): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'approved') throw new Error('Solo se pueden apelar propuestas aprobadas')
  if (proposal.grace_period_end) {
    if (Date.now() > new Date(proposal.grace_period_end).getTime()) throw new Error('El periodo de apelaci?n ha expirado')
  }

  const { data, error } = await supabase.from('proposals').update({ appealed: true }).eq('id', proposalId).select().single()
  if (error) throw error

  try {
    await supabase.from('audit_log').insert({ community_id: communityId, user_id: appealedByUserId, action: 'appeal_proposal', entity_type: 'proposal', entity_id: proposalId, details: { appealed_at: new Date().toISOString() } })
  } catch { /* audit best-effort */ }

  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(communityId, 'proposal_closed', `Propuesta apelada: ${proposal.title}`, 'La ejecuci?n ha sido pausada por una apelaci?n', { proposal_id: proposalId })
  } catch { /* best-effort */ }

  return data as unknown as Proposal
}

export async function updateProposalStatus(proposalId: string, status: string, extra?: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('proposals').update({ status, ...extra }).eq('id', proposalId)
  if (error) throw error
}

export async function closeProposal(proposalId: string, communityId: string, closedByUserId: string): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  const summary = await getVoteSummary(proposalId, communityId, proposal.quorum_required, proposal.majority_required)

  const model = proposal.voting_model || 'simple'
  const hasBlocks = model === 'consensus' && (await getVotes(proposalId)).some((v) => v.value === 'block')
  const resultStatus = summary.quorum_met && summary.majority_met ? 'approved' : 'rejected'
  const resultText = hasBlocks
    ? 'Rechazada - bloqueada por un miembro (consenso)'
    : summary.quorum_met
      ? (summary.majority_met ? 'Aprobada por mayor?a' : 'Rechazada - no alcanz? mayor?a')
      : 'Rechazada - no alcanz? qu?rum'

  const updateData: Record<string, unknown> = { status: resultStatus, result: resultText, closed_at: new Date().toISOString(), closed_by: closedByUserId }

  if (resultStatus === 'approved' && proposal.financial_instruction) {
    const { data: community } = await supabase.from('communities').select('config, rules').eq('id', communityId).single()
    const comm = community as { config?: Record<string, unknown>; rules?: Record<string, unknown> } | null
    const rules = getCommunityRules(comm?.config ?? null, comm?.rules ?? null)

    const instruction = proposal.financial_instruction as unknown as Record<string, unknown>
    const amount = Number(instruction.amount ?? instruction.new_amount ?? 0)
    const autoEnabled = rules.governance.auto_execution_enabled
    const threshold = rules.governance.auto_execution_threshold
    const coolDownHours = rules.governance.cool_down_hours || 0
    const belowThreshold = threshold === 0 || amount <= threshold

    if (autoEnabled && belowThreshold) {
      updateData.execution_status = 'cool_down'
      updateData.cool_down_until = new Date(Date.now() + coolDownHours * 60 * 60 * 1000).toISOString()
    }

    const gracePeriodHours = rules.governance.grace_period_hours || 0
    if (gracePeriodHours > 0) {
      updateData.grace_period_end = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000).toISOString()
    }
  }

  const { data, error } = await supabase.from('proposals').update(updateData).eq('id', proposalId).select().single()
  if (error) throw error

  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(communityId, 'proposal_closed', `Propuesta ${resultStatus === 'approved' ? 'aprobada' : 'rechazada'}: ${proposal.title}`, resultText, { proposal_id: proposalId, result: resultStatus })
  } catch { /* best-effort */ }

  if (resultStatus === 'approved') {
    sendEmailToMembers(communityId, 'proposal_approved', { title: proposal.title, proposal_id: proposalId, votes_for: summary.yes, votes_against: summary.no, community_name: communityId, app_url: window.location.origin }).catch(() => {})
  } else {
    sendEmailToMembers(communityId, 'proposal_closed', {
      title: proposal.title,
      proposal_id: proposalId,
      result: resultStatus,
      result_text: resultText,
      app_url: window.location.origin,
    }).catch(() => {})
  }
  void getActiveMemberIds(communityId)
    .then((memberIds) =>
      sendPushToMembers(
        memberIds,
        `Propuesta ${resultStatus === 'approved' ? 'aprobada' : 'rechazada'}: ${proposal.title}`,
        resultText,
        { proposal_id: proposalId, result: resultStatus },
      ),
    )
    .catch(() => {})

  return data as unknown as Proposal
}

export async function processExpiredProposals(): Promise<number> {
  const { data, error } = await (supabase as any).rpc('process_expired_proposals')
  if (error) { logger.warn('process_expired_proposals RPC not available yet', error.message); return 0 }
  return (data as number) ?? 0
}

export async function processAutoExecutions(): Promise<number> {
  const { data, error } = await (supabase as any).rpc('process_auto_executions')
  if (error) { logger.warn('process_auto_executions RPC not available yet:', error.message); return 0 }
  return (data as number) ?? 0
}

function inferElectionRoleFromProposal(proposal: Proposal): 'admin' | 'comite_vigilancia' | 'tesorero' {
  const text = `${proposal.title}\n${proposal.description}`.toLowerCase()
  const explicit = text.match(/cargo id:\s*(admin|comite_vigilancia|tesorero)/)
  if (explicit?.[1] === 'comite_vigilancia') return 'comite_vigilancia'
  if (explicit?.[1] === 'tesorero') return 'tesorero'
  if (explicit?.[1] === 'admin') return 'admin'
  if (text.includes('vigilancia')) return 'comite_vigilancia'
  if (text.includes('tesorero')) return 'tesorero'
  return 'admin'
}

function inferElectionSeatsFromProposal(proposal: Proposal, role: 'admin' | 'comite_vigilancia' | 'tesorero'): number {
  const text = `${proposal.title}\n${proposal.description}`.toLowerCase()
  const match = text.match(/vacantes:\s*(\d{1,2})/)
  const parsed = match?.[1] ? Number(match[1]) : 1
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  if (role === 'comite_vigilancia') return Math.min(parsed, 10)
  return 1
}

async function createElectionRunoffProposal(
  proposal: Proposal,
  communityId: string,
  tiedOptions: Array<{ id: string; label: string }>,
  remainingSeats: number,
): Promise<string> {
  const now = new Date()
  const votingEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000)
  const role = inferElectionRoleFromProposal(proposal)
  const title = `Desempate electoral: ${proposal.title}`
  const description = [
    'Desempate autom?tico generado por empate en la elecci?n original.',
    `Propuesta original: ${proposal.id}`,
    `Cargo ID: ${role}`,
    `Vacantes: ${remainingSeats}`,
    '',
    'Candidaturas en desempate:',
    ...tiedOptions.map((opt) => `- ${opt.label}`),
  ].join('\n')

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      community_id: communityId,
      title,
      description,
      type: 'election',
      status: 'active',
      quorum_required: proposal.quorum_required,
      majority_required: proposal.majority_required,
      voting_start: now.toISOString(),
      voting_end: votingEnd.toISOString(),
      created_by: proposal.created_by,
      template_id: 'eleccion',
      voting_model: 'multiple_choice',
      voting_options: tiedOptions as any,
      endorsements_required: 0,
      endorsements_met: true,
    } as any)
    .select('id')
    .single()
  if (error || !data?.id) throw error ?? new AppError('No se pudo crear propuesta de desempate.', 'CONFLICT')

  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'proposal_opened',
      `Desempate abierto: ${proposal.title}`,
      'Se abri? una votaci?n de desempate por empate en la elecci?n.',
      { proposal_id: data.id, source_proposal_id: proposal.id },
    )
  } catch {
    // Notificaci?n best-effort
  }
  return data.id as string
}

async function resolveElectionMemberIds(
  winningValues: string[],
  options: Array<{ id: string; label: string }>,
  communityId: string,
): Promise<string[]> {
  const electedMemberIds: string[] = []
  for (const winningValue of winningValues) {
    const optionFromValue = (() => {
      if (winningValue.startsWith('option_')) {
        const idx = Number(winningValue.replace('option_', '')) - 1
        return options[idx] ?? null
      }
      return options.find((opt) => opt.id === winningValue) ?? null
    })()

    let electedMemberId: string | null = null
    if (optionFromValue?.id?.startsWith('member_')) {
      electedMemberId = optionFromValue.id.replace('member_', '')
    } else if (optionFromValue?.label) {
      const { data: memberMatch } = await (supabase as any)
        .from('member_profiles')
        .select('id')
        .eq('community_id', communityId)
        .eq('status', 'active')
        .ilike('full_name', optionFromValue.label)
        .limit(1)
        .maybeSingle()
      electedMemberId = (memberMatch as { id?: string } | null)?.id ?? null
    }

    if (!electedMemberId) {
      throw new AppError('No se pudo identificar a uno de los miembros ganadores de la elecci?n.', 'VALIDATION')
    }
    electedMemberIds.push(electedMemberId)
  }
  return electedMemberIds
}

async function executeElectionProposal(proposal: Proposal, communityId: string): Promise<void> {
  const roleToAssign = inferElectionRoleFromProposal(proposal)
  const seats = inferElectionSeatsFromProposal(proposal, roleToAssign)
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('value, weight')
    .eq('proposal_id', proposal.id)
  if (votesError) throw votesError
  const votes = (votesData ?? []) as Array<{ value: string; weight: number }>
  if (votes.length === 0) throw new AppError('No hay votos para ejecutar esta elecci?n.', 'VALIDATION')

  const totals = new Map<string, number>()
  for (const vote of votes) {
    if (vote.value === 'abstain') continue
    totals.set(vote.value, (totals.get(vote.value) ?? 0) + Number(vote.weight || 1))
  }
  if (totals.size === 0) throw new AppError('No hay votos v?lidos para determinar ganador.', 'VALIDATION')

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  if (sorted.length < seats) {
    throw new AppError('No hay suficientes opciones con votos para cubrir las vacantes.', 'VALIDATION')
  }

  const cutoffWeight = sorted[seats - 1][1]
  const directWinnerValues = sorted.filter(([, w]) => w > cutoffWeight).map(([value]) => value)
  const tiedValues = sorted.filter(([, w]) => w === cutoffWeight).map(([value]) => value)
  const hasTieAtCutoff = tiedValues.length > 1 && directWinnerValues.length < seats

  let winningValues: string[] = sorted.slice(0, seats).map(([value]) => value)
  if (hasTieAtCutoff) {
    const remainingSeats = seats - directWinnerValues.length
    const options = (proposal.voting_options ?? []) as Array<{ id: string; label: string }>
    const tiedOptions = tiedValues.map((value) => {
      if (value.startsWith('option_')) {
        const idx = Number(value.replace('option_', '')) - 1
        return options[idx]
      }
      return options.find((opt) => opt.id === value)
    }).filter(Boolean) as Array<{ id: string; label: string }>

    if (tiedOptions.length < 2) {
      throw new AppError('Empate detectado sin opciones suficientes para desempate.', 'VALIDATION')
    }
    await createElectionRunoffProposal(proposal, communityId, tiedOptions, remainingSeats)
    winningValues = directWinnerValues
  }

  const options = (proposal.voting_options ?? []) as Array<{ id: string; label: string }>
  const electedMemberIds = await resolveElectionMemberIds(winningValues, options, communityId)
  const uniqueElectedMemberIds = [...new Set(electedMemberIds)]
  if (uniqueElectedMemberIds.length !== electedMemberIds.length) {
    throw new AppError('Resultado inv?lido: un mismo miembro no puede ocupar m?s de una vacante en la misma elecci?n.', 'VALIDATION')
  }

  for (const electedMemberId of uniqueElectedMemberIds) {
    const { data: winner, error: winnerError } = await supabase
      .from('members')
      .select('id, status, financial_standing')
      .eq('id', electedMemberId)
      .eq('community_id', communityId)
      .single()
    if (winnerError || !winner) throw winnerError ?? new AppError('Miembro ganador no encontrado.', 'NOT_FOUND')
    if (winner.status !== 'active') throw new AppError('Uno de los miembros ganadores no est? activo.', 'VALIDATION')
    if (winner.financial_standing === 'moroso') {
      throw new AppError('Los miembros morosos no pueden ser electos para este cargo.', 'FORBIDDEN')
    }
  }

  if (uniqueElectedMemberIds.length > 0) {
    const { error: closeTermError } = await supabase
      .from('admin_terms')
      .update({ status: 'completed', term_end: new Date().toISOString() })
      .eq('community_id', communityId)
      .eq('role', roleToAssign)
      .eq('status', 'active')
    if (closeTermError) throw closeTermError
  }

  for (const electedMemberId of uniqueElectedMemberIds) {
    const { error: roleError } = await supabase
      .from('members')
      .update({ role: roleToAssign })
      .eq('id', electedMemberId)
    if (roleError) throw roleError

    const { data: lastTerm } = await supabase
      .from('admin_terms')
      .select('term_number')
      .eq('community_id', communityId)
      .eq('member_id', electedMemberId)
      .eq('role', roleToAssign)
      .in('status', ['active', 'completed'])
      .order('term_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextTermNumber = ((lastTerm as { term_number?: number } | null)?.term_number ?? 0) + 1

    const { error: newTermError } = await supabase
      .from('admin_terms')
      .insert({
        community_id: communityId,
        member_id: electedMemberId,
        role: roleToAssign,
        term_number: nextTermNumber,
        elected_in_assembly: proposal.assembly_id ?? null,
        status: 'active',
      } as any)
    if (newTermError) throw newTermError
  }
}

export async function executeProposal(proposalId: string, communityId: string, executedByUserId: string): Promise<Proposal> {
  const proposal = await getProposal(proposalId)
  if (proposal.status !== 'approved') throw new AppError('Solo se pueden ejecutar propuestas aprobadas', 'VALIDATION')
  if (!proposal.financial_instruction && proposal.type !== 'election') {
    throw new AppError('Esta propuesta no tiene instrucci?n ejecutable', 'VALIDATION')
  }
  if (proposal.execution_status === 'executed') throw new AppError('Esta propuesta ya fue ejecutada', 'CONFLICT')

  if (proposal.execution_status === 'cool_down' && proposal.cool_down_until) {
    const coolDownEnd = new Date(proposal.cool_down_until).getTime()
    if (Date.now() < coolDownEnd) {
      throw new Error(`Propuesta en periodo de enfriamiento. Faltan ~${Math.ceil((coolDownEnd - Date.now()) / (1000 * 60 * 60))}h para poder ejecutar.`)
    }
  }

  if (proposal.type === 'election') {
    try {
      await executeElectionProposal(proposal, communityId)
      const { data, error } = await supabase.from('proposals')
        .update({ status: 'executed', execution_status: 'executed', executed_at: new Date().toISOString() })
        .eq('id', proposalId).select().single()
      if (error) throw error
      return data as unknown as Proposal
    } catch (execError) {
      await supabase.from('proposals').update({ execution_status: 'failed' }).eq('id', proposalId)
      throw execError
    }
  }

  const instruction = proposal.financial_instruction as unknown as Record<string, unknown>
  const instructionType = instruction.type as string

  try {
    switch (instructionType) {
      case 'disbursement': {
        const spendRequestId = instruction.spend_request_id as string | undefined
        if (spendRequestId) {
          // N3: solo marcar la solicitud como aprobada; la transacci?n se crea al "ejecutar" el pago desde Treasury
          const { error: srErr } = await supabase
            .from('spend_requests')
            .update({
              status: 'approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', spendRequestId)
            .eq('community_id', communityId)
          if (srErr) throw srErr
        } else {
          const fundType = (instruction.fund_type as string) || 'mantenimiento'
          const { error: txErr } = await supabase.from('transactions').insert({
            community_id: communityId,
            type: 'expense',
            amount: Number(instruction.amount) || 0,
            description: `[Gobernanza] ${(instruction.description as string) || proposal.title}`,
            date: new Date().toISOString().split('T')[0],
            category_id: (instruction.category_id as string) || null,
            fund_type: fundType,
            created_by: executedByUserId,
            origin: 'system',
            verification_status: 'reported',
          })
          if (txErr) throw txErr
        }
        break
      }
      case 'budget_allocation': {
        const period = (instruction.period as string) || new Date().toISOString().substring(0, 7)
        const categoryId = instruction.category_id as string | undefined
        const amount = Number(instruction.amount) || 0
        if (!categoryId) throw new Error('budget_allocation requiere category_id')

        const { data: existing } = await supabase.from('budgets').select('id').eq('community_id', communityId).eq('category_id', categoryId).eq('period', period).maybeSingle()
        if (existing) {
          const { error: budgetErr } = await supabase.from('budgets').update({ amount, approved_by_proposal_id: proposalId }).eq('id', existing.id)
          if (budgetErr) throw budgetErr
        } else {
          const { error: budgetErr } = await supabase.from('budgets').insert({ community_id: communityId, category_id: categoryId, period, amount, approved_by_proposal_id: proposalId })
          if (budgetErr) throw budgetErr
        }
        break
      }
      case 'quota_change': {
        const newAmount = Number(instruction.new_amount ?? instruction.amount) || 0
        const effectiveDate = (instruction.effective_date as string) || new Date().toISOString().split('T')[0]
        const concept = (instruction.description as string) || `Cuota aprobada por gobernanza: ${proposal.title}`
        const { data: activeMembers, error: membersErr } = await supabase.from('members').select('id').eq('community_id', communityId).eq('status', 'active')
        if (membersErr) throw membersErr
        if (activeMembers && activeMembers.length > 0) {
          type ActiveMemberRow = { id: string; [k: string]: unknown }
          const obligations = (activeMembers as ActiveMemberRow[]).map((m) => ({ community_id: communityId, member_id: m.id, amount: newAmount, due_date: effectiveDate, concept, status: 'pending' }))
          const { error: obErr } = await supabase.from('payment_obligations').insert(obligations)
          if (obErr) throw obErr
        }
        break
      }
      case 'removal': {
        const targetMemberId = instruction.member_id as string
        if (!targetMemberId) throw new Error('La instrucci?n de remoci?n requiere member_id.')
        const { error: roleError } = await supabase
          .from('members')
          .update({ role: 'miembro' })
          .eq('id', targetMemberId)
          .eq('community_id', communityId)
        if (roleError) throw roleError
        break
      }
      case 'config_change': {
        const configKey = instruction.config_key as string
        const configValue = instruction.config_value
        if (!configKey) throw new Error('config_change requiere config_key')
        const { data: community, error: comErr } = await supabase.from('communities').select('config, rules').eq('id', communityId).single()
        if (comErr) throw comErr
        const commRow = community as { config?: Record<string, unknown>; rules?: Record<string, unknown> } | null
        const currentRules = getCommunityRules(commRow?.config ?? null, commRow?.rules ?? null)
        const parts = configKey.split('.')
        if (parts.length === 2) {
          const [section, key] = parts as [keyof typeof currentRules, string]
          if (section in currentRules) (currentRules[section] as unknown as Record<string, unknown>)[key] = configValue
        } else if (parts.length === 1) {
          const key = parts[0]
          for (const section of ['governance', 'treasury', 'identity'] as const) {
            if (key in currentRules[section]) { (currentRules[section] as unknown as Record<string, unknown>)[key] = configValue; break }
          }
        }
        await updateCommunityRules(communityId, currentRules)
        break
      }
      case 'none': break
      default: throw new Error(`Tipo de instrucci?n no soportado: ${instructionType}`)
    }

    const { data, error } = await supabase.from('proposals')
      .update({ status: 'executed', execution_status: 'executed', executed_at: new Date().toISOString() })
      .eq('id', proposalId).select().single()
    if (error) throw error
    return data as unknown as Proposal
  } catch (execError) {
    await supabase.from('proposals').update({ execution_status: 'failed' }).eq('id', proposalId)
    throw execError
  }
}
