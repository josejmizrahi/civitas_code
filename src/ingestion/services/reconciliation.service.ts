import { supabase } from '@/shared/lib/supabase'
import type { NormalizedTransaction } from '../types'

export async function markDuplicates(
  communityId: string,
  transactions: NormalizedTransaction[]
): Promise<NormalizedTransaction[]> {
  // Fetch existing external_refs for this community
  const { data: existing } = await supabase
    .from('transactions')
    .select('external_ref, date, amount')
    .eq('community_id', communityId)
    .not('external_ref', 'is', null)

  const existingSet = new Set(
    (existing ?? []).map((tx: any) => `${tx.external_ref}|${tx.date}|${tx.amount}`)
  )

  return transactions.map((tx) => {
    if (tx.external_ref && tx.date && tx.amount !== null) {
      const key = `${tx.external_ref}|${tx.date}|${tx.amount}`
      return { ...tx, _isDuplicate: existingSet.has(key) }
    }
    return { ...tx, _isDuplicate: false }
  })
}
