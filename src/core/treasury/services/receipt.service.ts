import { supabase } from '@/shared/lib/supabase'
import type { Transaction } from '../types'

export interface DigitalReceiptData {
  receiptNumber: string
  communityName: string
  date: string
  memberName: string
  concept: string
  amount: number
  currency: string
  transactionId: string
  verificationHash: string
  generatedAt: string
}

async function getNextReceiptNumber(communityId: string): Promise<string> {
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId)
    .eq('type', 'income')

  const seq = (count ?? 0) + 1
  const year = new Date().getFullYear()
  return `REC-${year}-${String(seq).padStart(5, '0')}`
}

function computeHash(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()
}

export async function generateReceipt(
  transaction: Transaction,
  communityName: string,
  memberName: string,
  currency = 'MXN'
): Promise<DigitalReceiptData> {
  const receiptNumber = await getNextReceiptNumber(transaction.community_id)

  const hashInput = `${transaction.id}|${transaction.amount}|${transaction.date}|${receiptNumber}`
  const verificationHash = computeHash(hashInput)

  return {
    receiptNumber,
    communityName,
    date: transaction.date,
    memberName,
    concept: transaction.description || 'Pago de cuota',
    amount: transaction.amount,
    currency,
    transactionId: transaction.id,
    verificationHash,
    generatedAt: new Date().toISOString(),
  }
}

export async function verifyTransaction(
  transactionId: string,
  status: 'verified' | 'disputed'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('transactions')
    .update({
      verification_status: status,
      verified_by: user?.id ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) throw error
}
