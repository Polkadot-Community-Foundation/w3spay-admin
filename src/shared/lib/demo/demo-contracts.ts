// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { H160Hex } from "@shared/lib/address.ts";

import { envConfig } from "@/config.ts";
import { isDemoMode } from "./demo-mode.ts";

export const DEMO_REGISTRY_ADDRESS: H160Hex =
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead" as H160Hex;

export function resolveEffectiveRegistryAddress(): string {
  if (isDemoMode()) return DEMO_REGISTRY_ADDRESS;
  return envConfig.contracts.merchantRegistryAddress;
}
