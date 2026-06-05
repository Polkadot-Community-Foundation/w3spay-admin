// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { DEMO_MERCHANT_SEED } from "./demo-merchants.ts";
import type { RegistryMerchantRow } from "@features/merchant/merchant-model.ts";

let rows: ReadonlyArray<RegistryMerchantRow> = DEMO_MERCHANT_SEED;

export function getDemoMerchantRows(): ReadonlyArray<RegistryMerchantRow> {
  return rows;
}

export function setDemoMerchantRows(next: ReadonlyArray<RegistryMerchantRow>): void {
  rows = next;
}

/** Test/HMR only — restore the seed. */
export function resetDemoMerchantRows(): void {
  rows = DEMO_MERCHANT_SEED;
}
