// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { AccountId32Hex } from "@shared/lib/address.ts";
import type { TxStatus } from "@/shared/chain/contracts";
import {
  makeMerchantEffectOracle,
  writeMerchantRegistry,
  type MerchantRegistryWriteContext,
} from "@shared/chain/merchant-registry-write.ts";

export interface UpdateMerchantPayload {
  readonly merchantId: string;
  readonly terminalId: string;
  readonly destinationAccountId: AccountId32Hex;
  readonly displayName: string;
}

export async function updateMerchant(options: {
  readonly context: MerchantRegistryWriteContext;
  readonly payload: UpdateMerchantPayload;
  readonly onStatus?: (status: TxStatus) => void;
}): Promise<`0x${string}`> {
  const { context, payload, onStatus } = options;
  return writeMerchantRegistry({
    context,
    functionName: "updateMerchant",
    args: [
      payload.merchantId,
      payload.terminalId,
      payload.destinationAccountId,
      payload.displayName,
    ],
    onStatus,
    // Inclusion oracle: both mutable fields land. A "no-op" update where
    // destination + displayName already equal the new values would trivially
    // satisfy this, but the UI only submits when something actually changed.
    waitForChainEffect: makeMerchantEffectOracle(
      context,
      payload.merchantId,
      payload.terminalId,
      (entry) =>
        entry.exists &&
        entry.displayName === payload.displayName &&
        entry.destinationAccountId.toLowerCase() ===
          payload.destinationAccountId.toLowerCase(),
    ),
  });
}
