// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { AdminMerchant } from "@features/merchant/merchant-model.ts";

export type BalanceSort = "name" | "status" | "recent" | "balance";

export function sortByBalance(
  sort: BalanceSort,
  balances: ReadonlyMap<string, bigint>,
): (a: AdminMerchant, b: AdminMerchant) => number {
  return (a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "status") return a.status.localeCompare(b.status);
    if (sort === "balance") {
      const ba = balances.get(a.destinationAccountId) ?? 0n;
      const bb = balances.get(b.destinationAccountId) ?? 0n;
      if (bb === ba) return 0;
      return bb > ba ? 1 : -1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  };
}
