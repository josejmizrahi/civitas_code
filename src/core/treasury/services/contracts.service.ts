import { supabase } from '@/shared/lib/supabase'
import { resolveUserNames, resolveMemberNames } from '@/shared/lib/resolveNames'
import type { Contract, ContractInstallment } from '../types'

// ==================== CONTRACTS ====================

export async function getContracts(communityId: string, filters?: { status?: string; entity_id?: string }): Promise<Contract[]> {
  let query = supabase
    .from('contracts')
    .select('*, entities(name), proposals!approved_by_proposal_id(title)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const userIds = [...new Set(rows.map((r: any) => r.created_by).filter(Boolean))]
  const memberIds = [...new Set(rows.map((r: any) => r.member_id).filter(Boolean))]
  const nameMap = await resolveUserNames(communityId, userIds)
  const memberNameMap = await resolveMemberNames(communityId, memberIds)

  return rows.map((row: any) => ({
    ...row,
    entity_name: row.entities?.name,
    creator_name: nameMap.get(row.created_by) || undefined,
    member_name: memberNameMap.get(row.member_id) || undefined,
    proposal_title: row.proposals?.title || undefined,
    entities: undefined,
    proposals: undefined,
  }))
}

export async function getContract(contractId: string): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, entities(name), proposals!approved_by_proposal_id(title)')
    .eq('id', contractId)
    .single()
  if (error) throw error
  const row = data as any
  const nameMap = row.created_by
    ? await resolveUserNames(row.community_id, [row.created_by])
    : new Map()
  const memberNameMap = row.member_id
    ? await resolveMemberNames(row.community_id, [row.member_id])
    : new Map()

  return {
    ...row,
    entity_name: row.entities?.name,
    creator_name: nameMap.get(row.created_by) || undefined,
    member_name: memberNameMap.get(row.member_id) || undefined,
    proposal_title: row.proposals?.title || undefined,
    entities: undefined,
    proposals: undefined,
  } as Contract
}

export async function createContract(
  communityId: string,
  contract: {
    name: string
    description?: string
    type: string
    entity_id?: string
    member_id?: string
    total_amount: number
    payment_frequency?: string
    number_of_installments?: number
    start_date: string
    end_date?: string
    terms?: Record<string, unknown>
    created_by: string
  }
): Promise<Contract> {
  const { data, error } = await (supabase
    .from('contracts') as any)
    .insert({ community_id: communityId, ...contract })
    .select()
    .single()
  if (error) throw error
  return data as Contract
}

export async function updateContract(
  contractId: string,
  updates: Partial<Pick<Contract, 'name' | 'description' | 'status' | 'end_date' | 'terms'>>
): Promise<Contract> {
  const { data, error } = await (supabase
    .from('contracts') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', contractId)
    .select()
    .single()
  if (error) throw error
  return data as Contract
}

export async function deleteContract(contractId: string): Promise<void> {
  const { error } = await (supabase.from('contracts') as any).delete().eq('id', contractId)
  if (error) throw error
}

// ==================== INSTALLMENTS ====================

export async function getInstallments(contractId: string): Promise<ContractInstallment[]> {
  const { data, error } = await supabase
    .from('contract_installments')
    .select('*')
    .eq('contract_id', contractId)
    .order('installment_number')
  if (error) throw error
  return (data ?? []) as ContractInstallment[]
}

export async function generateInstallments(
  contract: Contract,
  communityId: string
): Promise<ContractInstallment[]> {
  const n = contract.number_of_installments
  const installmentAmount = Math.round((contract.total_amount / n) * 100) / 100
  const startDate = new Date(contract.start_date)

  const records = Array.from({ length: n }, (_, i) => {
    const dueDate = new Date(startDate)
    switch (contract.payment_frequency) {
      case 'weekly': dueDate.setDate(dueDate.getDate() + i * 7); break
      case 'biweekly': dueDate.setDate(dueDate.getDate() + i * 14); break
      case 'monthly': dueDate.setMonth(dueDate.getMonth() + i); break
      case 'bimonthly': dueDate.setMonth(dueDate.getMonth() + i * 2); break
      case 'quarterly': dueDate.setMonth(dueDate.getMonth() + i * 3); break
      case 'semiannual': dueDate.setMonth(dueDate.getMonth() + i * 6); break
      case 'annual': dueDate.setFullYear(dueDate.getFullYear() + i); break
      default: dueDate.setMonth(dueDate.getMonth() + i); break
    }
    return {
      contract_id: contract.id,
      community_id: communityId,
      installment_number: i + 1,
      amount: i === n - 1
        ? Math.round((contract.total_amount - installmentAmount * (n - 1)) * 100) / 100
        : installmentAmount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending' as const,
    }
  })

  const { data, error } = await (supabase
    .from('contract_installments') as any)
    .insert(records)
    .select()
  if (error) throw error
  return (data ?? []) as ContractInstallment[]
}

export async function markInstallmentPaid(
  installment: ContractInstallment,
  communityId: string,
  createdBy: string,
  reference?: string
): Promise<{ installment: ContractInstallment; transactionId: string }> {
  const description = `Pago contrato parcialidad #${installment.installment_number}${reference ? ` (Ref: ${reference})` : ''}`

  const { data: tx, error: txError } = await (supabase
    .from('transactions') as any)
    .insert({
      community_id: communityId,
      type: 'expense',
      amount: installment.amount,
      description,
      date: new Date().toISOString().split('T')[0],
      created_by: createdBy,
      external_ref: reference || null,
    })
    .select()
    .single()
  if (txError) throw txError

  const { data: updated, error: upError } = await (supabase
    .from('contract_installments') as any)
    .update({
      status: 'paid',
      paid_amount: installment.amount,
      paid_at: new Date().toISOString(),
      transaction_id: tx.id,
    })
    .eq('id', installment.id)
    .select()
    .single()
  if (upError) throw upError

  // Update compliance score
  await (supabase as any).rpc('update_contract_compliance', { p_contract_id: installment.contract_id })

  return { installment: updated as ContractInstallment, transactionId: tx.id }
}

export async function refreshOverdueInstallments(communityId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await (supabase
    .from('contract_installments') as any)
    .update({ status: 'overdue' })
    .eq('community_id', communityId)
    .eq('status', 'pending')
    .lt('due_date', today)
    .select()
  if (error) throw error
  return data?.length ?? 0
}
