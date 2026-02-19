import { supabase } from '@/shared/lib/supabase'
import { getCommunityRules } from '@/shared/services/rules.service'
import { sendEmailToMembers } from '@/shared/services/email.service'
import type { GovernanceRules } from '@/shared/types/rules'
import type {
  Assembly,
  AssemblyStatus,
  AgendaItem,
  AttendanceRecord,
  Convocatoria,
  DeliveryRecord,
} from '../types'

// ---------------------------------------------------------------------------
// Assemblies — CRUD
// ---------------------------------------------------------------------------

export async function getAssemblies(
  communityId: string,
  status?: string
): Promise<Assembly[]> {
  let query = supabase
    .from('assemblies')
    .select('*')
    .eq('community_id', communityId)
    .order('scheduled_date', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Assembly[]
}

export async function getAssembly(assemblyId: string): Promise<Assembly> {
  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .eq('id', assemblyId)
    .single()

  if (error) throw error

  const assembly = data as unknown as Assembly

  // Join caller name
  if (assembly.called_by) {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', assembly.called_by)
      .single()

    if (member) {
      // Get full name from member_profile_view or auth
      const { data: profile } = await supabase
        .from('member_profiles')
        .select('full_name')
        .eq('id', assembly.called_by)
        .maybeSingle()

      assembly.caller_name = (profile as any)?.full_name || 'Administrador'
    }
  }

  return assembly
}

export async function createAssembly(
  communityId: string,
  data: {
    type: string
    title: string
    scheduled_date: string
    location: string
    agenda: AgendaItem[]
    called_by: string
  }
): Promise<Assembly> {
  // Validate minimum notice days
  const { data: community } = await supabase
    .from('communities')
    .select('config, rules')
    .eq('id', communityId)
    .single()

  const rules = getCommunityRules(
    (community as any)?.config ?? null,
    (community as any)?.rules ?? null
  )
  const minNoticeDays = rules.governance.minimum_notice_days || 7

  const scheduledDate = new Date(data.scheduled_date)
  const now = new Date()
  const diffDays = Math.ceil(
    (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays < minNoticeDays) {
    throw new Error(
      `La fecha de la asamblea debe ser al menos ${minNoticeDays} dias despues de hoy (Art. 34 LPCI). Dias de anticipacion: ${diffDays}`
    )
  }

  // Create assembly
  const { data: assembly, error } = await (supabase.from('assemblies') as any)
    .insert({
      community_id: communityId,
      type: data.type,
      title: data.title,
      scheduled_date: data.scheduled_date,
      location: data.location,
      agenda: data.agenda,
      called_by: data.called_by,
      status: 'scheduled',
      current_call: 1,
    })
    .select()
    .single()

  if (error) throw error

  // Auto-create first convocatoria
  await createConvocatoria(communityId, {
    assembly_id: (assembly as any).id,
    call_number: 1,
    type: data.type,
    scheduled_date: data.scheduled_date,
    location: data.location,
    agenda: data.agenda,
    called_by: data.called_by,
    minimum_notice_days: minNoticeDays,
  })

  // Notify community about new assembly
  try {
    const { notifyCommunity } = await import('@/shared/services/notification.service')
    await notifyCommunity(
      communityId,
      'assembly_scheduled',
      `Nueva asamblea: ${data.title}`,
      `Programada para ${new Date(data.scheduled_date).toLocaleDateString('es-MX')}. Ubicación: ${data.location}`,
      { assembly_id: (assembly as any).id }
    )
  } catch { /* notifications are best-effort */ }

  return assembly as unknown as Assembly
}

// ---------------------------------------------------------------------------
// Assembly status transitions
// ---------------------------------------------------------------------------

export async function updateAssemblyStatus(
  assemblyId: string,
  status: AssemblyStatus,
  callAt?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status }

  // Set call timestamps based on status
  if (status === 'first_call') {
    updateData.current_call = 1
    updateData.first_call_at = callAt || new Date().toISOString()
  } else if (status === 'second_call') {
    updateData.current_call = 2
    updateData.second_call_at = callAt || new Date().toISOString()
  } else if (status === 'third_call') {
    updateData.current_call = 3
    updateData.third_call_at = callAt || new Date().toISOString()
  }

  const { error } = await (supabase.from('assemblies') as any)
    .update(updateData)
    .eq('id', assemblyId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function recordAttendance(
  assemblyId: string,
  attendanceRecords: AttendanceRecord[]
): Promise<void> {
  // Calculate quorum percentage
  const totalIndiviso = attendanceRecords.reduce(
    (sum, r) => sum + r.indiviso_pct,
    0
  )
  const presentIndiviso = attendanceRecords
    .filter((r) => r.present)
    .reduce((sum, r) => sum + r.indiviso_pct, 0)

  const quorumPct =
    totalIndiviso > 0 ? (presentIndiviso / totalIndiviso) * 100 : 0

  const { error } = await (supabase.from('assemblies') as any)
    .update({
      attendance: attendanceRecords,
      quorum_pct: quorumPct,
      quorum_met: quorumPct >= 50,
    })
    .eq('id', assemblyId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Convocatorias — CRUD
// ---------------------------------------------------------------------------

export async function createConvocatoria(
  communityId: string,
  data: {
    assembly_id: string
    call_number: number
    type: string
    scheduled_date: string
    location: string
    agenda: AgendaItem[]
    called_by: string
    minimum_notice_days: number
  }
): Promise<Convocatoria> {
  const { data: convocatoria, error } = await (
    supabase.from('convocatorias') as any
  )
    .insert({
      community_id: communityId,
      assembly_id: data.assembly_id,
      call_number: data.call_number,
      type: data.type,
      scheduled_date: data.scheduled_date,
      location: data.location,
      agenda: data.agenda,
      called_by: data.called_by,
      issued_at: new Date().toISOString(),
      minimum_notice_days: data.minimum_notice_days,
      delivery_method: 'in_app',
      delivery_log: [],
    })
    .select()
    .single()

  if (error) throw error

  const created = convocatoria as unknown as Convocatoria
  sendEmailToMembers(communityId, 'convocatoria', {
    title: `Convocatoria ${data.call_number}ª llamada — ${data.type}`,
    date: new Date(data.scheduled_date).toLocaleDateString('es-MX'),
    location: data.location,
    description: data.agenda.map((a: AgendaItem) => a.topic).join(', '),
    assembly_id: data.assembly_id,
    community_name: communityId,
    app_url: window.location.origin,
  }).catch(() => {})

  return created
}

export async function getConvocatorias(
  assemblyId: string
): Promise<Convocatoria[]> {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('assembly_id', assemblyId)
    .order('call_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Convocatoria[]
}

export async function recordDelivery(
  convocatoriaId: string,
  memberId: string,
  memberName: string,
  method: string
): Promise<void> {
  // Fetch existing delivery_log
  const { data: conv, error: fetchErr } = await supabase
    .from('convocatorias')
    .select('delivery_log')
    .eq('id', convocatoriaId)
    .single()

  if (fetchErr) throw fetchErr

  const existingLog = ((conv as any)?.delivery_log ?? []) as DeliveryRecord[]
  const newRecord: DeliveryRecord = {
    member_id: memberId,
    member_name: memberName,
    method,
    delivered_at: new Date().toISOString(),
  }

  const { error } = await (supabase.from('convocatorias') as any)
    .update({
      delivery_log: [...existingLog, newRecord],
    })
    .eq('id', convocatoriaId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Quorum calculation — pure function (3-tier system per LPCI CDMX Art. 33)
// ---------------------------------------------------------------------------

export function calculateAssemblyQuorum(
  attendance: AttendanceRecord[],
  governanceRules: GovernanceRules,
  callNumber: number,
  assemblyType: string,
  morosoMemberIds: string[] = []
): { quorumMet: boolean; currentPct: number; requiredPct: number; morosExcluded: number } {
  const eligibleAttendance = attendance.filter(r => !morosoMemberIds.includes(r.member_id))
  const totalIndiviso = eligibleAttendance.reduce((sum, r) => sum + r.indiviso_pct, 0)
  const presentIndiviso = eligibleAttendance
    .filter((r) => r.present)
    .reduce((sum, r) => sum + r.indiviso_pct, 0)

  const currentPct = totalIndiviso > 0 ? presentIndiviso / totalIndiviso : 0

  let requiredPct: number

  if (assemblyType === 'extraordinary') {
    // Extraordinary assemblies always require extraordinary quorum
    requiredPct = governanceRules.extraordinary_quorum
  } else {
    // Ordinary assemblies use 3-tier system
    switch (callNumber) {
      case 1:
        requiredPct = governanceRules.quorum_first_call
        break
      case 2:
        requiredPct = governanceRules.quorum_second_call
        break
      case 3:
      default:
        requiredPct = governanceRules.quorum_third_call
        break
    }
  }

  const quorumMet = currentPct >= requiredPct

  return {
    quorumMet,
    currentPct,
    requiredPct,
    morosExcluded: attendance.length - eligibleAttendance.length,
  }
}
