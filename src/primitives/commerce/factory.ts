/**
 * Commerce Factory — Creates the right adapter based on community config
 *
 * Usage:
 *   const gateway = createPaymentGateway(community)
 *   const session = await gateway.createCheckout(params)
 */

import type { PaymentGateway } from './ports/PaymentGateway'
import type { TransferProvider } from './ports/TransferProvider'
import { FintocGateway, FintocTransferProvider } from './adapters/fintoc'
import { ManualGateway } from './adapters/manual'

interface CommunityFintechConfig {
  fintoc_status?: string | null
  fintoc_root_clabe?: string | null
  fintoc_public_key?: string | null
  rules?: {
    treasury?: {
      mode?: string
      clabe?: string | null
      bank_name?: string | null
      beneficiary_name?: string | null
    }
  }
}

/** Create a PaymentGateway for the given community */
export function createPaymentGateway(community: CommunityFintechConfig): PaymentGateway {
  if (community.fintoc_status === 'active' && community.fintoc_public_key) {
    return new FintocGateway()
  }

  // Fall back to manual with bank info if available
  const treasury = community.rules?.treasury
  if (treasury?.clabe) {
    return new ManualGateway({
      clabe: treasury.clabe,
      bankName: treasury.bank_name ?? '',
      beneficiary: treasury.beneficiary_name ?? '',
    })
  }

  return new ManualGateway()
}

/** Create a TransferProvider for the given community */
export function createTransferProvider(community: CommunityFintechConfig): TransferProvider | null {
  if (community.fintoc_status === 'active') {
    return new FintocTransferProvider()
  }

  // Manual communities can't do outbound transfers
  return null
}
