// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { AccountId32Hex } from "@shared/lib/address.ts";
import type { TxStatus } from "@/shared/chain/contracts";
import {
  makeMerchantEffectOracle,
  writeMerchantRegistry,
  type MerchantRegistryWriteContext,
} from "@shared/chain/merchant-registry-write.ts";

/**
 * Dedicated "rotate payout destination" path — distinct from
 * `UpdateMerchantPayload`, which also rewrites `displayName` and would risk
 * wiping the name when an admin only wants to change the address.
 */
export interface SetMerchantDestinationPayload {
  readonly merchantId: string;
  readonly terminalId: string;
  readonly destinationAccountId: AccountId32Hex;
}

export async function setMerchantDestination(options: {
  readonly context: MerchantRegistryWriteContext;
  readonly payload: SetMerchantDestinationPayload;
  readonly onStatus?: (status: TxStatus) => void;
}): Promise<`0x${string}`> {
  const { context, payload, onStatus } = options;
  return writeMerchantRegistry({
    context,
    functionName: "setMerchantDestination",
    args: [payload.merchantId, payload.terminalId, payload.destinationAccountId],
    onStatus,
    // Inclusion oracle: destination matches the new value. displayName is
    // intentionally unchecked — the contract preserves it here.
    waitForChainEffect: makeMerchantEffectOracle(
      context,
      payload.merchantId,
      payload.terminalId,
      (entry) =>
        entry.exists &&
        entry.destinationAccountId.toLowerCase() ===
          payload.destinationAccountId.toLowerCase(),
    ),
  });
}
