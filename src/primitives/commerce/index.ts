// Ports (contracts)
export type {
  PaymentGateway,
  CheckoutParams,
  CheckoutSession,
  PaymentEvent,
  ReconciliationStatus,
  WebhookResult,
  ReconciliationResult,
  ReconciliationStats,
} from './ports'

export type {
  TransferProvider,
  TransferParams,
  TransferResult,
  TransferStatus,
  BalanceInfo,
  MovementFilters,
  Movement,
} from './ports'

export type {
  KybProvider,
  KybStatus,
  KybCommunityInfo,
  KybApplication,
} from './ports'

// Factory
export { createPaymentGateway, createTransferProvider } from './factory'

// Adapters (for direct use when needed)
export { FintocGateway, FintocTransferProvider } from './adapters/fintoc'
export { ManualGateway } from './adapters/manual'
