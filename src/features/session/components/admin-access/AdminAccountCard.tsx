// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

/**
 * The SS58 encoding of the same account is intentionally not shown — surfacing both
 * addresses only confused non-crypto pilot users, and the access script consumes this
 * (pallet-revive H160) form.
 */

import { shortenAddress } from "@shared/utils/format.ts";
import { ACard, AEye } from "@shared/components/primitives.tsx";
import { AddressBlock } from "./AddressBlock.tsx";
import type { AdminAccountCardProps } from "./types.ts";

export function AdminAccountCard({
  identity,
  title = "Your account",
  compact = false,
}: AdminAccountCardProps) {
  return (
    <ACard padding={compact ? 12 : 16}>
      <AEye>{title}</AEye>
      <AddressBlock
        label="Account address"
        value={identity.copyTarget}
        shortValue={shortenAddress(identity.copyTarget)}
        copyLabel="account-address"
        copyText="Copy address"
        primary
      />
    </ACard>
  );
}
