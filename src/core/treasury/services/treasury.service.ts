import { supabase } from '@/shared/lib/supabase'
import { AppError, handleServiceError } from '@/shared/lib/errors'
import { assertCanPerformAction, getCommunityRules } from '@/shared/services/rules.service'
import { notifyCommunity, notifyMember, notifyVigilance } from '@/shared/services/notification.service'
import { sendEmailToMembers } from '@/shared/services/email.service'
import { sendPushToMembers } from '@/shared/services/push-notification.service'
import type { TreasuryRules } from '@/shared/types/rules'
import type {
  Transaction,
  Category,
  Budget,
  PaymentObligation,
  DashboardStats,
  CollectionConfig,
  DiscretionaryApproval,
} from '../types'

async function getMemberIdByUserId(communityId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return (data as { id: string }).id
}

async function getNotificationRecipients(
  communityId: string,
  roles: string[],
): Promise<Array<{ id: string; role: string }>> {
  const { data, error } = await supabase
    .from('members')
    .select('id, role')
    .eq('community_id', communityId)
    .eq('status', 'active')
    .in('role', roles)
  if (error || !data) return []
  return data as Array<{ id: string; role: string }>
}

function getMonthBounds(date: string): { start: string; end: string; period: string } {
  const [year, month] = date.split('-').map(Number)
  if (!year || !month) {
    throw new AppError('La fecha de la transacción es inválida.', 'VALIDATION')
  }
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  const toIsoDate = (d: Date) => d.toISOString().split('T')[0]
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    period: `${year}-${String(month).padStart(2, '0')}`,
  }
}

async function getTreasuryRulesForCommunity(communityId: string): Promise<TreasuryRules> {
  const { data: community, error } = await supabase
    .from('communities')
    .select('config, rules')
    .eq('id', communityId)
    .single()
  if (error || !community) {
    throw new AppError('No se pudo cargar la configuración de tesorería.', 'NOT_FOUND')
  }
  const resolved = getCommunityRules(
    (community.config ?? null) as Record<string, unknown> | null,
    (community.rules ?? null) as Record<string, unknown> | null,
  )
  return resolved.treasury
}

async function validateExpenseAgainstBudget(
  communityId: string,
  amount: number,
  categoryId: string,
  date: string,
): Promise<void> {
  const { start, end, period } = getMonthBounds(date)

  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, amount')
    .eq('community_id', communityId)
    .eq('category_id', categoryId)
    .eq('period', period)
    .maybeSingle()
  if (budgetError) throw budgetError
  if (!budget) {
    throw new AppError(
      `No existe presupuesto aprobado para esta categoría en el periodo ${period}.`,
      'FORBIDDEN',
    )
  }

  const { data: expenses, error: expensesError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('community_id', communityId)
    .eq('type', 'expense')
    .eq('category_id', categoryId)
    .gte('date', start)
    .lte('date', end)
  if (expensesError) throw expensesError

  const spent = (expenses ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0)
  const budgetAmount = Number((budget as { amount: number }).amount ?? 0)
  const available = budgetAmount - spent
  if (amount > available) {
    await notifyVigilance(
      communityId,
      'budget_exceeded',
      'Presupuesto excedido',
      `Intento de registro de egreso que excede el presupuesto. Categoría: ${categoryId}. Periodo: ${period}. Disponible: ${available.toLocaleString('es-MX')}, solicitado: ${amount.toLocaleString('es-MX')}.`,
      { category_id: categoryId, period, available, requested: amount },
    )
    throw new AppError(
      `Presupuesto insuficiente. Disponible: ${available.toLocaleString('es-MX')}, solicitado: ${amount.toLocaleString('es-MX')}.`,
      'FORBIDDEN',
    )
  }
}

async function createEmergencyRatificationProposal(
  communityId: string,
  createdByUserId: string,
  amount: number,
  expenseDescription: string,
  transactionId: string,
): Promise<void> {
  const now = new Date()
  const end = new Date(now.getTime() + 72 * 60 * 60 * 1000)
  // Ratificación extraordinaria por emergencia: quórum/majority conservadores.
  const quorum = 0.75
  const majority = 0.66

  const { error } = await supabase
    .from('proposals')
    .insert({
      community_id: communityId,
      title: `Ratificación de gasto de emergencia (${amount.toLocaleString('es-MX')})`,
      description: `Ratificación obligatoria del gasto de emergencia registrado. Transacción: ${transactionId}. Concepto: ${expenseDescription || 'Sin descripción'}.`,
      type: 'extraordinary',
      status: 'active',
      quorum_required: quorum,
      majority_required: majority,
      voting_start: now.toISOString(),
      voting_end: end.toISOString(),
      created_by: createdByUserId,
    })
  if (error) throw error

  await notifyCommunity(
    communityId,
    'proposal_opened',
    'Votación abierta: ratificación de gasto de emergencia',
    'Se abrió una votación extraordinaria (72h) para ratificar un gasto de emergencia.',
    { transaction_id: transactionId, amount },
  )
}

/**
 * List transactions for a community with optional filters (date range, category, type, fund).
 * Returns rows with joined category name.
 */
export async function getTransactions(
  communityId: string,
  filters?: { dateFrom?: string; dateTo?: string; categoryId?: string; type?: string; fundType?: string }
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('community_id', communityId)
    .order('date', { ascending: false })

  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('date', filters.dateTo)
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.fundType) query = (query as any).eq('fund_type', filters.fundType)

  const { data, error } = await query
  if (error) throw handleServiceError(error, 'treasury.getTransactions')
  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: row.categories?.name,
    categories: undefined,
  }))
}

/** List categories for a community (income/expense). */
export async function getCategories(communityId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('community_id', communityId)
    .order('name')

  if (error) throw error
  return (data ?? []) as Category[]
}

export async function getBudgets(communityId: string, fundType?: string): Promise<Budget[]> {
  let query = supabase
    .from('budgets')
    .select('*, categories(name)')
    .eq('community_id', communityId)
    .order('period', { ascending: false })

  if (fundType) {
    query = (query as any).eq('fund_type', fundType)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: row.categories?.name,
    categories: undefined,
  }))
}

export async function getPaymentObligations(communityId: string, memberId?: string): Promise<PaymentObligation[]> {
  let query = supabase
    .from('payment_obligations')
    .select('*')
    .eq('community_id', communityId)
    .order('due_date', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PaymentObligation[]
}

export async function getDashboardStats(communityId: string, fundType?: string): Promise<DashboardStats> {
  let query = supabase
    .from('transactions')
    .select('type, amount, date, categories(name)')
    .eq('community_id', communityId)

  if (fundType) {
    query = (query as any).eq('fund_type', fundType)
  }

  const { data: transactions, error } = await query

  if (error) throw error

  const rows = transactions ?? []
  let totalIncome = 0
  let totalExpenses = 0
  const categoryMap = new Map<string, { amount: number; type: string }>()
  const monthlyMap = new Map<string, { income: number; expenses: number }>()

  for (const row of rows as any[]) {
    const amount = Number(row.amount)
    const categoryName = row.categories?.name || 'Sin categoría'
    const month = row.date?.substring(0, 7) || 'unknown'

    if (row.type === 'income') {
      totalIncome += amount
    } else {
      totalExpenses += amount
    }

    const existing = categoryMap.get(categoryName) ?? { amount: 0, type: row.type }
    existing.amount += amount
    categoryMap.set(categoryName, existing)

    const monthData = monthlyMap.get(month) ?? { income: 0, expenses: 0 }
    if (row.type === 'income') monthData.income += amount
    else monthData.expenses += amount
    monthlyMap.set(month, monthData)
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory: Array.from(categoryMap.entries()).map(([name, data]) => ({ name, ...data })),
    monthlyData: Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  }
}

export async function createTransaction(
  communityId: string,
  transaction: {
    type: string
    amount: number
    category_id?: string
    description: string
    date: string
    created_by: string
    origin?: string
    emergency?: boolean
  }
): Promise<Transaction> {
  const treasuryRules = await getTreasuryRulesForCommunity(communityId)
  const adminLimit = Number(treasuryRules.admin_spending_limit ?? 50000)
  const assemblyThreshold = Number(treasuryRules.require_vote_above ?? adminLimit)
  const isExpense = transaction.type === 'expense'

  const memberId = await getMemberIdByUserId(communityId, transaction.created_by)
  if (memberId) {
    await assertCanPerformAction(communityId, memberId, 'register_transaction')
  }

  if (isExpense && !transaction.emergency) {
    if (transaction.amount > adminLimit && transaction.amount <= assemblyThreshold) {
      throw new AppError(
        'Este egreso requiere aprobación discrecional (Nivel 2) antes de registrarse.',
        'FORBIDDEN',
      )
    }
    if (transaction.amount > assemblyThreshold) {
      throw new AppError(
        'Este egreso requiere propuesta y votación de asamblea (Nivel 3) o marcarse como emergencia (Nivel 4).',
        'FORBIDDEN',
      )
    }
    if (!transaction.category_id) {
      throw new AppError('Los egresos deben incluir categoría para validar presupuesto.', 'VALIDATION')
    }
    await validateExpenseAgainstBudget(
      communityId,
      Number(transaction.amount),
      transaction.category_id,
      transaction.date,
    )
  }

  if (isExpense && transaction.emergency) {
    if (transaction.amount <= assemblyThreshold) {
      throw new AppError(
        'Solo los egresos por encima del umbral de asamblea pueden registrarse como emergencia.',
        'VALIDATION',
      )
    }
    if (!memberId) {
      throw new AppError('No se pudo resolver al miembro que registra el gasto de emergencia.', 'NOT_FOUND')
    }
    await assertCanPerformAction(communityId, memberId, 'create_proposal')
  }

  const { emergency, ...payload } = transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      origin: payload.origin ?? 'manual',
      ...payload,
    })
    .select()
    .single()

  if (error) throw error

  if (isExpense && emergency) {
    try {
      await createEmergencyRatificationProposal(
        communityId,
        payload.created_by,
        Number(payload.amount),
        payload.description,
        (data as { id: string }).id,
      )
    } catch {
      await notifyCommunity(
        communityId,
        'proposal_new',
        'Atención: falta ratificación de emergencia',
        'Se registró un gasto de emergencia, pero la propuesta de ratificación no se creó automáticamente. Debe crearse manualmente.',
        { transaction_id: (data as { id: string }).id },
      )
    }
  }

  return data as Transaction
}

/**
 * Create a correction transaction linked to an original. Does not modify or delete the original.
 * Amount: positive to add (e.g. original was underreported), negative to offset (e.g. original was overreported).
 */
export async function createCorrectionTransaction(
  communityId: string,
  originalTransactionId: string,
  params: {
    type: string
    amount: number
    description: string
    date: string
    created_by: string
    category_id?: string
    correction_note: string
  },
): Promise<Transaction> {
  const memberId = await getMemberIdByUserId(communityId, params.created_by)
  if (memberId) {
    await assertCanPerformAction(communityId, memberId, 'register_transaction')
  }

  const { data: original, error: fetchError } = await supabase
    .from('transactions')
    .select('id, community_id, type, amount, description')
    .eq('id', originalTransactionId)
    .eq('community_id', communityId)
    .single()
  if (fetchError || !original) {
    throw new AppError('Transacción original no encontrada o no pertenece a esta comunidad.', 'NOT_FOUND')
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: params.type,
      amount: Math.abs(params.amount),
      description: params.description,
      date: params.date,
      created_by: params.created_by,
      origin: 'manual',
      category_id: params.category_id ?? (original as { category_id?: string }).category_id ?? null,
      correction_of: originalTransactionId,
      correction_note: params.correction_note,
    })
    .select()
    .single()
  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(transactionId: string, updates: Partial<Pick<Transaction, 'type' | 'amount' | 'category_id' | 'description' | 'date'>>): Promise<Transaction> {
  void transactionId
  void updates
  throw new AppError('Las transacciones son inmutables. Registra una transacción de corrección en su lugar.', 'FORBIDDEN')
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  void transactionId
  throw new AppError('Las transacciones no se pueden eliminar. Usa una corrección contable.', 'FORBIDDEN')
}

/** Set vigilance flag and note (Comité de Vigilancia). GAP-06. */
export async function setVigilanceFlag(
  communityId: string,
  memberId: string,
  transactionId: string,
  flag: boolean,
  note?: string | null,
): Promise<Transaction> {
  await assertCanPerformAction(communityId, memberId, 'flag_transaction')
  const { data, error } = await supabase
    .from('transactions')
    .update({ vigilance_flag: flag, vigilance_note: flag ? (note ?? null) : null })
    .eq('id', transactionId)
    .eq('community_id', communityId)
    .select()
    .single()
  if (error) throw error
  return data as Transaction
}

export async function createBudget(communityId: string, budget: { category_id: string; period: string; amount: number }): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .insert({ community_id: communityId, ...budget })
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return { ...data, category_name: data.categories?.name, categories: undefined } as Budget
}

export async function updateBudget(budgetId: string, updates: { amount?: number; period?: string }): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', budgetId)
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return { ...data, category_name: data.categories?.name, categories: undefined } as Budget
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
  if (error) throw error
}

export async function createPaymentObligation(communityId: string, obligation: { member_id: string; amount: number; due_date: string; concept: string }): Promise<PaymentObligation> {
  const { data, error } = await supabase
    .from('payment_obligations')
    .insert({ community_id: communityId, ...obligation })
    .select()
    .single()
  if (error) throw error
  return data as PaymentObligation
}

export async function createBulkObligations(communityId: string, memberIds: string[], obligation: { amount: number; due_date: string; concept: string }): Promise<PaymentObligation[]> {
  const records = memberIds.map(id => ({ community_id: communityId, member_id: id, ...obligation }))
  const { data, error } = await supabase
    .from('payment_obligations')
    .insert(records)
    .select()
  if (error) throw error
  return (data ?? []) as PaymentObligation[]
}

/**
 * Mark pending obligations as overdue when past due_date, then refresh financial standings.
 */
export async function refreshOverdueObligations(communityId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('payment_obligations')
    .update({ status: 'overdue' })
    .eq('community_id', communityId)
    .eq('status', 'pending')
    .lt('due_date', today)
    .select()

  if (error) throw error
  return data?.length ?? 0
}

export async function updateObligationStatus(obligationId: string, status: string, paymentTransactionId?: string): Promise<PaymentObligation> {
  const updateData: Record<string, unknown> = { status }
  if (paymentTransactionId) updateData.payment_transaction_id = paymentTransactionId
  const { data, error } = await supabase
    .from('payment_obligations')
    .update(updateData)
    .eq('id', obligationId)
    .select()
    .single()
  if (error) throw error
  return data as PaymentObligation
}

/**
 * Mark an obligation as paid and automatically create the corresponding income transaction.
 * This is the core "collection" flow for MVP.
 */
export async function markObligationAsPaid(
  obligation: PaymentObligation,
  paymentDetails: {
    method: 'spei' | 'efectivo' | 'transferencia' | 'otro'
    reference?: string
    date?: string
    notes?: string
    created_by: string
  }
): Promise<{ transaction: Transaction; obligation: PaymentObligation }> {
  const memberId = await getMemberIdByUserId(obligation.community_id, paymentDetails.created_by)
  if (memberId) {
    await assertCanPerformAction(obligation.community_id, memberId, 'reconcile_payment')
  }

  const description = `Pago: ${obligation.concept}${paymentDetails.reference ? ` (Ref: ${paymentDetails.reference})` : ''}${paymentDetails.notes ? ` — ${paymentDetails.notes}` : ''}`

  const txData = {
    community_id: obligation.community_id,
    type: 'income' as const,
    amount: obligation.amount,
    description,
    date: paymentDetails.date || new Date().toISOString().split('T')[0],
    created_by: paymentDetails.created_by,
    external_ref: paymentDetails.reference || null,
    origin: 'system' as const,
  }

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert(txData)
    .select()
    .single()
  if (txError) throw txError

  const { data: updatedOb, error: obError } = await supabase
    .from('payment_obligations')
    .update({ status: 'paid', payment_transaction_id: tx.id })
    .eq('id', obligation.id)
    .select()
    .single()
  if (obError) throw obError

  return {
    transaction: tx as Transaction,
    obligation: updatedOb as PaymentObligation,
  }
}

/**
 * Get collection stats for the dashboard (pending/overdue/collected).
 */
export async function getCollectionStats(communityId: string): Promise<{
  totalObligations: number
  pendingCount: number
  overdueCount: number
  paidCount: number
  pendingAmount: number
  overdueAmount: number
  collectedAmount: number
  collectionRate: number
}> {
  const { data, error } = await supabase
    .from('payment_obligations')
    .select('status, amount')
    .eq('community_id', communityId)

  if (error) throw error
  const rows = data ?? []

  let pendingCount = 0, overdueCount = 0, paidCount = 0
  let pendingAmount = 0, overdueAmount = 0, collectedAmount = 0

  for (const row of rows) {
    const amount = Number(row.amount)
    switch (row.status) {
      case 'pending':
        pendingCount++
        pendingAmount += amount
        break
      case 'overdue':
        overdueCount++
        overdueAmount += amount
        break
      case 'paid':
        paidCount++
        collectedAmount += amount
        break
    }
  }

  const totalObligations = rows.length
  const collectionRate = totalObligations > 0 ? paidCount / totalObligations : 0

  return {
    totalObligations,
    pendingCount,
    overdueCount,
    paidCount,
    pendingAmount,
    overdueAmount,
    collectedAmount,
    collectionRate,
  }
}

/**
 * Get community collection config from rules.
 */
export function getCollectionConfig(rules: Record<string, unknown> | null): CollectionConfig {
  const treasury = (rules?.treasury ?? {}) as Record<string, unknown>
  return {
    clabe: (treasury?.clabe as string) ?? null,
    bank_name: (treasury?.bank_name as string) ?? null,
    beneficiary_name: (treasury?.beneficiary_name as string) ?? null,
    payment_reference_prefix: (treasury?.payment_reference_prefix as string) ?? null,
  }
}

/**
 * Generate a unique payment reference for a member obligation.
 */
export function generatePaymentReference(prefix: string | null, obligationId: string): string {
  const p = prefix || 'CIV'
  const shortId = obligationId.replace(/-/g, '').substring(0, 8).toUpperCase()
  return `${p}-${shortId}`
}

// ==================== DISCRETIONARY APPROVALS (LEVEL 2) ====================

export async function getDiscretionaryApprovals(
  communityId: string,
  status?: DiscretionaryApproval['status'],
): Promise<DiscretionaryApproval[]> {
  let query = supabase
    .from('discretionary_approvals')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as DiscretionaryApproval[]
}

export async function createDiscretionaryApproval(
  communityId: string,
  payload: {
    requested_by_member_id: string
    amount: number
    description: string
    category_id?: string | null
    beneficiary_entity_id?: string | null
  },
): Promise<DiscretionaryApproval> {
  await assertCanPerformAction(communityId, payload.requested_by_member_id, 'register_transaction')

  const { data, error } = await supabase
    .from('discretionary_approvals')
    .insert({
      community_id: communityId,
      requested_by: payload.requested_by_member_id,
      amount: payload.amount,
      description: payload.description,
      category_id: payload.category_id ?? null,
      beneficiary_entity_id: payload.beneficiary_entity_id ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  const recipients = await getNotificationRecipients(communityId, ['comite_vigilancia', 'admin', 'platform_admin'])
  await Promise.all(
    recipients.map((recipient) =>
      notifyMember(
        communityId,
        recipient.id,
        'discretionary_request',
        'Nueva solicitud discrecional pendiente',
        `Se solicitó una aprobación discrecional por ${payload.amount.toLocaleString('es-MX')}.`,
        { approval_id: data.id, amount: payload.amount },
      ),
    ),
  )
  void sendPushToMembers(
    recipients.map((recipient) => recipient.id),
    'Nueva solicitud discrecional pendiente',
    `Se solicitó una aprobación discrecional por ${payload.amount.toLocaleString('es-MX')}.`,
    { approval_id: data.id, amount: payload.amount },
  )
  void sendEmailToMembers(communityId, 'discretionary_request', {
    amount: payload.amount,
    description: payload.description,
    approval_id: data.id,
    app_url: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return data as unknown as DiscretionaryApproval
}

export async function respondDiscretionaryApproval(
  approvalId: string,
  responderMemberId: string,
  decision: 'approved' | 'rejected',
  responseNote?: string,
): Promise<DiscretionaryApproval> {
  const { data: approvalRaw, error: approvalError } = await supabase
    .from('discretionary_approvals')
    .select('*')
    .eq('id', approvalId)
    .single()

  const approval = approvalRaw as DiscretionaryApproval | null
  if (approvalError || !approval) throw approvalError ?? new Error('Solicitud discrecional no encontrada')
  await assertCanPerformAction(approval.community_id, responderMemberId, 'approve_discretionary')
  if (approval.status !== 'pending') throw new Error('Esta solicitud ya fue atendida')

  let transactionId: string | null = null
  if (decision === 'approved') {
    const { data: requesterMember, error: requesterError } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', approval.requested_by)
      .single()
    if (requesterError || !requesterMember?.user_id) throw requesterError ?? new Error('No se pudo resolver el solicitante')

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        community_id: approval.community_id,
        type: 'expense',
        amount: approval.amount,
        category_id: approval.category_id,
        description: `[Nivel 2] ${approval.description}`,
        date: new Date().toISOString().split('T')[0],
        created_by: requesterMember.user_id,
        origin: 'system',
      })
      .select('id')
      .single()
    if (txError) throw txError
    transactionId = tx.id as string
  }

  const { data, error } = await supabase
    .from('discretionary_approvals')
    .update({
      status: decision,
      approved_by: responderMemberId,
      response_note: responseNote ?? null,
      transaction_id: transactionId,
      responded_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .select()
    .single()

  if (error) throw error
  const decisionLabel = decision === 'approved' ? 'aprobada' : 'rechazada'
  await notifyMember(
    approval.community_id,
    approval.requested_by,
    'discretionary_decision',
    `Tu solicitud discrecional fue ${decisionLabel}`,
    `La solicitud por ${approval.amount.toLocaleString('es-MX')} fue ${decisionLabel}.`,
    { approval_id: approval.id, decision, transaction_id: transactionId },
  )
  const committee = await getNotificationRecipients(approval.community_id, ['comite_vigilancia', 'admin', 'platform_admin'])
  await Promise.all(
    committee
      .filter((member) => member.id !== approval.requested_by)
      .map((recipient) =>
        notifyMember(
          approval.community_id,
          recipient.id,
          'discretionary_decision',
          `Solicitud discrecional ${decisionLabel}`,
          `La solicitud por ${approval.amount.toLocaleString('es-MX')} fue ${decisionLabel}.`,
          { approval_id: approval.id, decision, transaction_id: transactionId },
        ),
      ),
  )
  void sendPushToMembers(
    [approval.requested_by],
    `Tu solicitud discrecional fue ${decisionLabel}`,
    `La solicitud por ${approval.amount.toLocaleString('es-MX')} fue ${decisionLabel}.`,
    { approval_id: approval.id, decision, transaction_id: transactionId },
  )
  void sendEmailToMembers(approval.community_id, 'discretionary_decision', {
    decision,
    amount: approval.amount,
    description: approval.description,
    approval_id: approval.id,
    transaction_id: transactionId,
    app_url: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return data as unknown as DiscretionaryApproval
}
