// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useCallback, useMemo } from "react";
import {
  requestAccessHostWallet,
  retryHostWallet,
  useHostWallet,
  type HostWalletState,
} from "@shared/chain/host";

import { envConfig } from "@/config";
import { deriveH160 } from "@shared/lib/address.ts";
import { getAdminProductIdentifier } from "@shared/utils/get-admin-product-id.ts";
import {
  buildAdminGrantIdentity,
  type ProductAccountState,
  type UseProductAccountResult,
} from "@features/session/account.ts";

export function useProductAccount(): UseProductAccountResult {
  const productIdentifier = getAdminProductIdentifier();
  const derivationIndex = envConfig.host.productDerivationIndex;

  const wallet = useHostWallet({
    productIdentifier,
    derivationIndex,
  });
  const state: ProductAccountState = useMemo(
    () => projectState(wallet.state, productIdentifier, derivationIndex),
    [wallet.state, productIdentifier, derivationIndex],
  );

  const requestAccess = useCallback(async () => {
    await requestAccessHostWallet("Request W3sPay admin access");
  }, []);

  const refresh = useCallback(async () => {
    await retryHostWallet();
  }, []);

  return { state, requestAccess, refresh };
}

function projectState(
  s: HostWalletState,
  productIdentifier: string,
  derivationIndex: number,
): ProductAccountState {
  if (s.kind === "outside-host") return { kind: "outside-host" };
  if (s.kind === "pending") return { kind: "pending" };
  if (s.kind === "resolving") {
    if (s.phase === undefined) return { kind: "pending" };
    return { kind: "resolving" };
  }
  if (s.kind === "requesting-access") {
    return { kind: "requesting" };
  }
  if (s.kind === "error") return { kind: "error", reason: s.reason };
  if (s.kind === "ready") {
    const publicKey = s.productAccount.publicKey;
    const identity = buildAdminGrantIdentity(
      publicKey,
      deriveH160(publicKey),
      productIdentifier,
      derivationIndex,
    );
    return {
      kind: "ready",
      account: {
        ...identity,
        productAccount: s.productAccount,
        signer: s.signer,
      },
    };
  }
  const _exhaustive: never = s;
  void _exhaustive;
  return { kind: "error", reason: "unknown host-wallet state" };
}
