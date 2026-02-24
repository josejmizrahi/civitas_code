/**
 * Manual Payment Gateway — For communities without a fintech provider
 *
 * Generates manual payment references and instructions.
 * The admin then manually records the payment in Treasury.
 */

import type {
  PaymentGateway,
  CheckoutParams,
  CheckoutSession,
  PaymentEvent,
  WebhookResult,
  ReconciliationResult,
  ReconciliationStats,
} from '../../ports/PaymentGateway'

export class ManualGateway implements PaymentGateway {
  readonly providerId = 'manual'

  private bankInfo: { clabe: string; bankName: string; beneficiary: string } | null

  constructor(bankInfo?: { clabe: string; bankName: string; beneficiary: string }) {
    this.bankInfo = bankInfo ?? null
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    const reference = `CIV-${Date.now().toString(36).toUpperCase()}`

    return {
      id: `manual-${reference}`,
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      providerData: {
        type: 'manual',
        reference,
        instructions: this.bankInfo
          ? `Transferir $${params.amount} ${params.currency} a:\nCLABE: ${this.bankInfo.clabe}\nBanco: ${this.bankInfo.bankName}\nBeneficiario: ${this.bankInfo.beneficiary}\nReferencia: ${reference}\nConcepto: ${params.concept}`
          : `Realizar el pago de $${params.amount} ${params.currency} y notificar al administrador.\nReferencia: ${reference}\nConcepto: ${params.concept}`,
      },
    }
  }

  async getCheckoutStatus(sessionId: string): Promise<CheckoutSession> {
    // Manual payments don't have provider-side status
    return {
      id: sessionId,
      status: 'pending',
      amount: 0,
      currency: 'MXN',
    }
  }

  async processWebhook(): Promise<WebhookResult> {
    // Manual gateway has no webhooks
    return {
      accepted: false,
      eventId: null,
      paymentEvent: null,
      error: 'Manual gateway does not support webhooks',
    }
  }

  async reconcile(): Promise<ReconciliationResult> {
    // Manual reconciliation is handled directly through Treasury
    return {
      success: false,
      transactionId: null,
      obligationId: null,
      memberId: null,
      error: 'Use Treasury to manually register payments',
    }
  }

  async getReconciliationStats(): Promise<ReconciliationStats> {
    return {
      matched: 0,
      unmatched: 0,
      pending: 0,
      ignored: 0,
      totalAmount: 0,
      matchedAmount: 0,
    }
  }

  async getUnreconciledEvents(): Promise<PaymentEvent[]> {
    return []
  }
}
