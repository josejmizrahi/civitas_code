import { supabase } from '@/shared/lib/supabase'

// ==================== TYPES ====================

export interface StatementLineItem {
  category: string
  description: string
  amount: number
  date: string
}

export interface FinancialStatement {
  id: string
  community_id: string
  period: string
  fund_type: string
  opening_balance: number
  total_income: number
  total_expense: number
  closing_balance: number
  line_items: StatementLineItem[]
  generated_at: string
  generated_by: string | null
  approved: boolean
  approved_at: string | null
  approved_by: string | null
}

// ==================== SERVICE ====================

/**
 * Generate a monthly financial statement for a specific fund.
 * Uses the SQL function generate_monthly_statement which calculates
 * opening/closing balances and aggregates line items.
 */
export async function generateStatement(
  communityId: string,
  period: string,
  fundType: string
): Promise<FinancialStatement> {
  // Get the current user ID for generated_by
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any).rpc('generate_monthly_statement', {
    p_community_id: communityId,
    p_period: period,
    p_fund_type: fundType,
    p_generated_by: user?.id ?? null,
  })

  if (error) throw error

  // The RPC returns the statement ID; fetch the full record
  const statementId = data as string
  return getStatement(statementId)
}

/**
 * Get all financial statements for a community, optionally filtered by fund type.
 */
export async function getStatements(
  communityId: string,
  fundType?: string
): Promise<FinancialStatement[]> {
  let query = supabase
    .from('financial_statements')
    .select('*')
    .eq('community_id', communityId)
    .order('period', { ascending: false })

  if (fundType) {
    query = query.eq('fund_type', fundType)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as FinancialStatement[]
}

/**
 * Get a single financial statement by ID.
 */
export async function getStatement(statementId: string): Promise<FinancialStatement> {
  const { data, error } = await supabase
    .from('financial_statements')
    .select('*')
    .eq('id', statementId)
    .single()

  if (error) throw error
  return data as unknown as FinancialStatement
}

/**
 * Approve a financial statement (admin action — Art. 43 LPCI CDMX).
 */
export async function approveStatement(statementId: string, approvedBy: string): Promise<void> {
  const { error } = await supabase.from('financial_statements')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', statementId)

  if (error) throw error
}
