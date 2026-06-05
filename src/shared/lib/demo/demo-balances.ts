// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { envConfig } from "@/config";
import { type AccountId32Hex } from "@shared/lib/address.ts";

const MAX_WHOLE_TOKENS = 9_999;

function hashHex(hex: AccountId32Hex): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 2; i < hex.length; i += 1) {
    h = Math.imul(h ^ hex.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

export function getDemoTokenBalance(accountId32: AccountId32Hex): bigint {
  const h = hashHex(accountId32);
  const whole = BigInt(h % (MAX_WHOLE_TOKENS + 1));
  const fracMix = Math.imul(h, 0x9e3779b1) >>> 0;
  const scale = 10n ** BigInt(envConfig.token.decimals);
  const frac = BigInt(fracMix) % scale;
  return whole * scale + frac;
}
