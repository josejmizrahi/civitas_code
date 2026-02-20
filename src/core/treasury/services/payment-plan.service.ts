import { supabase } from '@/shared/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentPlan {
  id: string
  community_id: string
  member_id: string
  total_debt: number
  number_of_installments: number
  installment_amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  start_date: string
  status: 'proposed' | 'active' | 'completed' | 'defaulted' | 'cancelled'
  proposed_by: string | null
  approved_by: string | null
  approved_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  member_name?: string
  approver_name?: string
}

export interface PlanInstallment {
  id: string
  plan_id: string
  installment_number: number
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_obligation_id: string | null
  paid_at: string | null
  paid_amount: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Get payment plans
// ---------------------------------------------------------------------------

export async function getPaymentPlans(communityId: string): Promise<PaymentPlan[]> {
  const { data, error } = await supabase
    .from('payment_plans')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PaymentPlan[]
}

export async function getMemberPaymentPlans(memberId: string): Promise<PaymentPlan[]> {
  const { data, error } = await supabase
    .from('payment_plans')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PaymentPlan[]
}

export async function getPaymentPlan(planId: string): Promise<PaymentPlan> {
  const { data, error } = await supabase
    .from('payment_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (error) throw error
  return data as PaymentPlan
}

// ---------------------------------------------------------------------------
// Get installments
// ---------------------------------------------------------------------------

export async function getInstallments(planId: string): Promise<PlanInstallment[]> {
  const { data, error } = await supabase
    .from('payment_plan_installments')
    .select('*')
    .eq('plan_id', planId)
    .order('installment_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as PlanInstallment[]
}

// ---------------------------------------------------------------------------
// Propose a payment plan (member creates)
// ---------------------------------------------------------------------------

export async function proposePaymentPlan(
  communityId: string,
  plan: {
    member_id: string
    total_debt: number
    number_of_installments: number
    frequency: string
    start_date: string
    notes?: string
    proposed_by: string
  }
): Promise<PaymentPlan> {
  if (plan.total_debt <= 0) throw new Error('La deuda total debe ser mayor a cero')
  if (plan.number_of_installments < 2 || plan.number_of_installments > 36) {
    throw new Error('El número de parcialidades debe ser entre 2 y 36')
  }
  if (!['weekly', 'biweekly', 'monthly'].includes(plan.frequency)) {
    throw new Error('Frecuencia no válida')
  }

  const installmentAmount = Math.ceil((plan.total_debt / plan.number_of_installments) * 100) / 100

  const { data, error } = await (supabase.from('payment_plans') as any)
    .insert({
      community_id: communityId,
      member_id: plan.member_id,
      total_debt: plan.total_debt,
      number_of_installments: plan.number_of_installments,
      installment_amount: installmentAmount,
      frequency: plan.frequency,
      start_date: plan.start_date,
      status: 'proposed',
      proposed_by: plan.proposed_by,
      notes: plan.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as PaymentPlan
}

// ---------------------------------------------------------------------------
// Approve a payment plan (admin/tesorero)
// ---------------------------------------------------------------------------

export async function approvePaymentPlan(
  planId: string,
  approvedBy: string
): Promise<PaymentPlan> {
  const plan = await getPaymentPlan(planId)
  if (plan.status !== 'proposed') {
    throw new Error('Solo se pueden aprobar planes propuestos')
  }

  // Update plan status
  const { data, error } = await (supabase.from('payment_plans') as any)
    .update({
      status: 'active',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select()
    .single()

  if (error) throw error

  // Generate installments
  const installments = generateInstallmentDates(
    plan.start_date,
    plan.number_of_installments,
    plan.installment_amount,
    plan.frequency,
    plan.total_debt
  )

  const { error: instError } = await (supabase.from('payment_plan_installments') as any)
    .insert(
      installments.map((inst, idx) => ({
        plan_id: planId,
        installment_number: idx + 1,
        amount: inst.amount,
        due_date: inst.dueDate,
        status: 'pending',
      }))
    )

  if (instError) throw instError
  return data as PaymentPlan
}

// ---------------------------------------------------------------------------
// Reject/Cancel a payment plan
// ---------------------------------------------------------------------------

export async function cancelPaymentPlan(
  planId: string,
  reason: string
): Promise<PaymentPlan> {
  const { data, error } = await (supabase.from('payment_plans') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason,
    })
    .eq('id', planId)
    .select()
    .single()

  if (error) throw error
  return data as PaymentPlan
}

// ---------------------------------------------------------------------------
// Mark installment as paid
// ---------------------------------------------------------------------------

export async function markInstallmentPaid(
  installmentId: string,
  paidAmount: number
): Promise<PlanInstallment> {
  const { data: existing, error: fetchError } = await supabase
    .from('payment_plan_installments')
    .select('amount')
    .eq('id', installmentId)
    .single()

  if (fetchError) throw fetchError

  const expectedAmount = (existing as { amount: number }).amount

  const { data, error } = await (supabase.from('payment_plan_installments') as any)
    .update({
      status: paidAmount >= expectedAmount ? 'paid' : 'partial',
      paid_at: new Date().toISOString(),
      paid_amount: paidAmount,
    })
    .eq('id', installmentId)
    .select()
    .single()

  if (error) throw error

  // Check if all installments are paid → complete the plan
  const installment = data as PlanInstallment
  const allInstallments = await getInstallments(installment.plan_id)
  const allPaid = allInstallments.every((i) => i.status === 'paid')

  if (allPaid) {
    const { error: planErr } = await (supabase.from('payment_plans') as any)
      .update({ status: 'completed' })
      .eq('id', installment.plan_id)
    if (planErr) throw planErr
  }

  return installment
}

// ---------------------------------------------------------------------------
// Helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export function generateInstallmentDates(
  startDate: string,
  count: number,
  amount: number,
  frequency: string,
  totalDebt: number
): { dueDate: string; amount: number }[] {
  const result: { dueDate: string; amount: number }[] = []
  const start = new Date(startDate)

  for (let i = 0; i < count; i++) {
    const date = new Date(start)

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + i * 7)
        break
      case 'biweekly':
        date.setDate(date.getDate() + i * 14)
        break
      case 'monthly':
      default:
        date.setMonth(date.getMonth() + i)
        break
    }

    const isLast = i === count - 1
    const installmentAmount = isLast
      ? Math.round((totalDebt - amount * (count - 1)) * 100) / 100
      : amount

    result.push({
      dueDate: date.toISOString().split('T')[0],
      amount: installmentAmount,
    })
  }

  return result
}
