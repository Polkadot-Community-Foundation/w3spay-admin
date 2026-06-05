// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useMemo } from "react";

import {
  merchantFromRegistryRow,
  type AdminMerchant,
  type RegistryMerchantRow,
} from "@features/merchant/merchant-model.ts";
import { useMerchantRegistry, type MerchantRegistryReadState } from "./merchant-queries.ts";

const EMPTY_ROWS: ReadonlyArray<RegistryMerchantRow> = [];

export interface UseMerchantsResult {
  /** Read-only registry state machine (loading / config-error / error / ready). */
  readonly registry: MerchantRegistryReadState;
  readonly merchants: ReadonlyArray<AdminMerchant>;
  refreshMerchantEntries(): Promise<void>;
}

export function useMerchants(): UseMerchantsResult {
  const { state: registry, refresh: refreshMerchantEntries } = useMerchantRegistry();
  const rows = registry.kind === "ready" ? registry.rows : EMPTY_ROWS;
  const merchants = useMemo(() => rows.map(merchantFromRegistryRow), [rows]);
  return { registry, merchants, refreshMerchantEntries };
}
