// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ProductAccount } from "@/shared/chain/host";
import type { PolkadotSigner } from "polkadot-api";

import { envConfig } from "@/config";
import { buildAdminGrantIdentity, type ReadyAdminAccount } from "@features/session/account.ts";
import { deriveH160, hexToBytes } from "@shared/lib/address.ts";

export const DEMO_PUBLIC_KEY_HEX =
  "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d" as const;

export const DEMO_PUBLIC_KEY: Uint8Array = hexToBytes(DEMO_PUBLIC_KEY_HEX);

export const DEMO_ADMIN_H160 = deriveH160(DEMO_PUBLIC_KEY);

const DEMO_SIGNER: PolkadotSigner = {
  publicKey: DEMO_PUBLIC_KEY,
  signTx: () => {
    throw new Error(
      "Demo mode: synthetic signer was invoked. Demo writes must be intercepted before the chain layer is reached.",
    );
  },
  signBytes: () => {
    throw new Error(
      "Demo mode: synthetic signer was invoked. Demo writes must be intercepted before the chain layer is reached.",
    );
  },
};

export function buildDemoReadyAdminAccount(): ReadyAdminAccount {
  const identity = buildAdminGrantIdentity(DEMO_PUBLIC_KEY, DEMO_ADMIN_H160);
  const productAccount: ProductAccount = {
    dotNsIdentifier: envConfig.host.productDotNs,
    derivationIndex: envConfig.host.productDerivationIndex,
    publicKey: DEMO_PUBLIC_KEY,
  };
  return {
    ...identity,
    productAccount,
    signer: DEMO_SIGNER,
  };
}
