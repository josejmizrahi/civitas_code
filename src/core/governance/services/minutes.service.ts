import { supabase } from '@/shared/lib/supabase'
import type { Proposal, VoteSummary, Minutes } from '../types'

export async function generateMinutes(
  communityId: string, proposalId: string, proposal: Proposal, voteSummary: VoteSummary
): Promise<Minutes> {
  const { data: community } = await supabase.from('communities').select('name, type').eq('id', communityId).single()
  const communityRow = community as { name?: string; type?: string } | null
  const communityName = communityRow?.name || 'Comunidad'
  const isResidential = (communityRow?.type || 'general') === 'residential'

  const resultText = voteSummary.majority_met ? 'APROBADA' : 'RECHAZADA'
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const content = [
    `ACTA DE VOTACIÓN`, `${'='.repeat(60)}`, ``,
    `Comunidad: ${communityName}`, `Fecha: ${dateStr}`, `Hora: ${timeStr}`,
    isResidential ? `Tipo de asamblea: ${proposal.type === 'extraordinary' ? 'Extraordinaria' : 'Ordinaria'}` : '',
    ``, `PROPUESTA: ${proposal.title}`, `Tipo: ${proposal.type}`, ``, `DESCRIPCIÓN:`, proposal.description, ``,
    `${'─'.repeat(60)}`, `RESULTADOS DE VOTACIÓN:`, `${'─'.repeat(60)}`,
    `- Votos a favor:     ${voteSummary.yes} (peso ponderado)`,
    `- Votos en contra:   ${voteSummary.no} (peso ponderado)`,
    `- Abstenciones:      ${voteSummary.abstain} (peso ponderado)`,
    `- Total participación: ${voteSummary.total} de peso disponible`, ``,
    `- Participación:     ${(voteSummary.participation_pct * 100).toFixed(1)}%`,
    `- Quórum requerido:  ${(proposal.quorum_required * 100).toFixed(0)}%`,
    `- Quórum alcanzado:  ${voteSummary.quorum_met ? 'SÍ' : 'NO'}`,
    `- Mayoría requerida: ${(proposal.majority_required * 100).toFixed(0)}%`,
    `- Mayoría alcanzada: ${voteSummary.majority_met ? 'SÍ' : 'NO'}`, ``,
    `${'─'.repeat(60)}`, `RESOLUCIÓN: La propuesta ha sido ${resultText}.`,
    proposal.result ? `Nota: ${proposal.result}` : '', ``,
    `${'─'.repeat(60)}`, `ESPACIOS PARA FIRMA:`, `${'─'.repeat(60)}`, ``,
    `Presidente de la Asamblea: _________________________`, `Nombre:                    _________________________`, `Fecha:                     _________________________`, ``,
    `Secretario (Administrador): _________________________`, `Nombre:                     _________________________`, `Fecha:                      _________________________`, ``,
    isResidential ? `Comité de Vigilancia:       _________________________` : '',
    isResidential ? `Nombre:                     _________________________` : '',
    isResidential ? `Fecha:                      _________________________` : '',
    isResidential ? `` : '',
    `${'─'.repeat(60)}`,
    `Este documento fue generado automáticamente por Civitas.`,
    `La integridad del acta está protegida mediante firma digital SHA-256.`,
    isResidential ? `Conforme a la Ley de Propiedad en Condominio (LPCI CDMX).` : '',
  ].filter(Boolean).join('\n')

  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(content + now.toISOString()))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const integrityHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const { data, error } = await supabase.from('minutes')
    .insert({ community_id: communityId, proposal_id: proposalId, content, generated_at: now.toISOString(), approved: false, signatures: [], integrity_hash: integrityHash })
    .select().single()
  if (error) throw error
  return data as unknown as Minutes
}

export async function getMinutes(proposalId: string): Promise<Minutes | null> {
  const { data, error } = await supabase.from('minutes').select('*')
    .eq('proposal_id', proposalId).order('generated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as unknown as Minutes | null
}

export async function approveMinutes(minutesId: string, userId: string): Promise<Minutes> {
  const { data, error } = await supabase.from('minutes')
    .update({ approved: true, approved_at: new Date().toISOString(), approved_by: userId })
    .eq('id', minutesId).select().single()
  if (error) throw error
  return data as unknown as Minutes
}

export async function signMinutes(minutesId: string, memberId: string, memberName: string): Promise<Minutes> {
  const { data: current, error: fetchErr } = await supabase.from('minutes').select('*').eq('id', minutesId).single()
  if (fetchErr) throw fetchErr
  const minutes = current as unknown as Minutes

  const signedAt = new Date().toISOString()
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${minutes.content}|${memberId}|${signedAt}`))
  const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')

  const signatures = [...(minutes.signatures || []), { member_id: memberId, member_name: memberName, signed_at: signedAt, hash }]

  const { data, error } = await supabase.from('minutes')
    .update({ signatures: signatures as unknown as import('@/shared/types/database').Json }).eq('id', minutesId).select().single()
  if (error) throw error
  return data as unknown as Minutes
}
