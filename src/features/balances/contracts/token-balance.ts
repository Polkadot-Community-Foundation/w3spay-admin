// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { envConfig } from "@/config";
import { accountId32HexToSs58, type AccountId32Hex } from "@shared/lib/address.ts";
import { usePeopleClient } from "@shared/chain/client.ts";

interface AssetAccount {
  readonly balance: bigint;
}

interface AssetsQueryShim {
  readonly Assets: {
    readonly Account: {
      getValue(
        location: typeof envConfig.token.location,
        ss58: string,
        opts?: { at?: "best" | "finalized" },
      ): Promise<AssetAccount | undefined>;
    };
  };
}

export class PeopleChainUnavailableError extends Error {
  constructor() {
    super("People chain client is not configured for the active network.");
    this.name = "PeopleChainUnavailableError";
  }
}

export async function fetchTokenBalance(
  accountId32: AccountId32Hex,
  at: "best" | "finalized" = "best",
): Promise<bigint> {
  const client = usePeopleClient();
  if (client == null) throw new PeopleChainUnavailableError();
  const ss58 = accountId32HexToSs58(accountId32);
  const query = client.unsafeApi.query as unknown as AssetsQueryShim;
  const account = await query.Assets.Account.getValue(envConfig.token.location, ss58, { at });
  return account?.balance ?? 0n;
}

export const TOKEN_BALANCE_TTL_MS = 60_000;

export type BalanceLoadState = "idle" | "loading" | "ready" | "error";

export interface UseTokenBalancesResult {
  readonly balances: ReadonlyMap<AccountId32Hex, bigint>;
  readonly state: BalanceLoadState;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
  readonly refreshOne: (accountId32: AccountId32Hex) => Promise<void>;
}

const TOKEN_SCALE = 10n ** BigInt(envConfig.token.decimals);

export function formatTokenAmount(planck: bigint | undefined): string {
  if (planck == null) return "—";
  const whole = planck / TOKEN_SCALE;
  const fraction = planck % TOKEN_SCALE;
  const fractionStr = fraction.toString().padStart(envConfig.token.decimals, "0");
  // Trim trailing zeros but keep at least 2 places for currency feel.
  const trimmed = fractionStr.replace(/0+$/, "");
  const padded = trimmed.length < 2 ? trimmed.padEnd(2, "0") : trimmed;
  return `${whole.toString()}.${padded}`;
}
