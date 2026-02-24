/**
 * Fintoc Transfer Adapter — Implements TransferProvider port
 */

import { supabase } from '@/shared/lib/supabase'
import type {
  TransferProvider,
  TransferParams,
  TransferResult,
  BalanceInfo,
  MovementFilters,
  Movement,
} from '../../ports/TransferProvider'

export class FintocTransferProvider implements TransferProvider {
  readonly providerId = 'fintoc'

  async sendTransfer(params: TransferParams): Promise<TransferResult> {
    const { data, error } = await supabase.functions.invoke('fintoc-transfer', {
      body: {
        community_id: params.communityId,
        amount: params.amount,
        currency: params.currency,
        destination_clabe: params.destinationClabe,
        destination_name: params.destinationName,
        concept: params.concept,
        reference: params.reference,
        spend_request_id: params.spendRequestId,
      },
    })

    if (error) throw error

    const raw = data as Record<string, unknown>
    return {
      id: raw.id as string,
      externalId: (raw.fintoc_transfer_id as string) ?? (raw.id as string),
      status: (raw.status as TransferResult['status']) ?? 'pending',
      amount: params.amount,
      currency: params.currency,
      destinationClabe: params.destinationClabe,
      createdAt: (raw.created_at as string) ?? new Date().toISOString(),
    }
  }

  async getTransferStatus(transferId: string): Promise<TransferResult> {
    const { data, error } = await supabase
      .from('fintoc_transfers')
      .select('*')
      .eq('id', transferId)
      .single()

    if (error) throw error

    const raw = data as Record<string, unknown>
    return {
      id: data.id,
      externalId: (raw.fintoc_transfer_id as string) ?? data.id,
      status: (data.status as TransferResult['status']) ?? 'pending',
      amount: data.amount / 100,
      currency: data.currency ?? 'MXN',
      destinationClabe: (raw.destination_clabe as string) ?? data.counterparty_clabe ?? '',
      createdAt: data.created_at,
      completedAt: (raw.completed_at as string) ?? undefined,
      failureReason: (raw.failure_reason as string) ?? undefined,
    }
  }

  async getBalance(communityId: string): Promise<BalanceInfo> {
    // Fintoc does not expose real-time balance — return computed from movements
    const { data } = await supabase
      .from('fintoc_events')
      .select('amount, reconciliation_status')
      .eq('community_id', communityId)
      .eq('reconciliation_status', 'matched')

    const matched = (data ?? []).reduce(
      (sum, e) => sum + ((e as { amount: number | null }).amount || 0) / 100,
      0,
    )

    return {
      available: matched,
      pending: 0,
      currency: 'MXN',
      asOf: new Date().toISOString(),
    }
  }

  async listMovements(filters: MovementFilters): Promise<Movement[]> {
    const { data, error } = await supabase
      .from('fintoc_transfers')
      .select('*')
      .eq('community_id', filters.communityId)
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 50)

    if (error) throw error

    return (data ?? []).map((t) => {
      const raw = t as Record<string, unknown>
      return {
        id: t.id,
        type: 'outbound' as const,
        amount: (t.amount || 0) / 100,
        currency: t.currency ?? 'MXN',
        reference: (raw.concept as string) ?? t.comment ?? '',
        counterpartyName: (raw.destination_name as string) ?? t.counterparty_name ?? null,
        counterpartyClabe: (raw.destination_clabe as string) ?? t.counterparty_clabe ?? null,
        date: t.created_at,
      }
    })
  }
}
