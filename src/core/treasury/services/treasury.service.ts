import { supabase } from '@/shared/lib/supabase'
import { handleServiceError } from '@/shared/lib/errors'
import type { Transaction, Category, Budget, PaymentObligation, DashboardStats, CollectionConfig } from '../types'

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
  }
): Promise<Transaction> {
  const { data, error } = await (supabase.from('transactions') as any)
    .insert({
      community_id: communityId,
      origin: transaction.origin ?? 'manual',
      ...transaction,
    })
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(transactionId: string, updates: Partial<Pick<Transaction, 'type' | 'amount' | 'category_id' | 'description' | 'date'>>): Promise<Transaction> {
  const { data, error } = await (supabase.from('transactions') as any)
    .update(updates)
    .eq('id', transactionId)
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return { ...data, category_name: data.categories?.name, categories: undefined } as Transaction
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await (supabase.from('transactions') as any)
    .delete()
    .eq('id', transactionId)
  if (error) throw error
}

export async function createBudget(communityId: string, budget: { category_id: string; period: string; amount: number }): Promise<Budget> {
  const { data, error } = await (supabase.from('budgets') as any)
    .insert({ community_id: communityId, ...budget })
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return { ...data, category_name: data.categories?.name, categories: undefined } as Budget
}

export async function updateBudget(budgetId: string, updates: { amount?: number; period?: string }): Promise<Budget> {
  const { data, error } = await (supabase.from('budgets') as any)
    .update(updates)
    .eq('id', budgetId)
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return { ...data, category_name: data.categories?.name, categories: undefined } as Budget
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const { error } = await (supabase.from('budgets') as any)
    .delete()
    .eq('id', budgetId)
  if (error) throw error
}

export async function createPaymentObligation(communityId: string, obligation: { member_id: string; amount: number; due_date: string; concept: string }): Promise<PaymentObligation> {
  const { data, error } = await (supabase.from('payment_obligations') as any)
    .insert({ community_id: communityId, ...obligation })
    .select()
    .single()
  if (error) throw error
  return data as PaymentObligation
}

export async function createBulkObligations(communityId: string, memberIds: string[], obligation: { amount: number; due_date: string; concept: string }): Promise<PaymentObligation[]> {
  const records = memberIds.map(id => ({ community_id: communityId, member_id: id, ...obligation }))
  const { data, error } = await (supabase.from('payment_obligations') as any)
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

  const { data, error } = await (supabase.from('payment_obligations') as any)
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
  const { data, error } = await (supabase.from('payment_obligations') as any)
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

  const { data: tx, error: txError } = await (supabase.from('transactions') as any)
    .insert(txData)
    .select()
    .single()
  if (txError) throw txError

  const { data: updatedOb, error: obError } = await (supabase.from('payment_obligations') as any)
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
  const { data, error } = await (supabase.from('payment_obligations') as any)
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
