// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { create } from "zustand";
import { requestAccessHostWallet, resolveNetwork, retryHostWallet } from "@shared/chain/host";

import { envConfig } from "@/config";
import type { ProductAccountState, ReadyAdminAccount } from "@features/session/account.ts";
import {
  type ChainSupport,
  type RemotePermissionOutcome,
} from "@features/session/permissions.ts";
import {
  resolveHostPermissions,
  type HostPermissionsSnapshot,
} from "@features/session/contracts/probe-permissions.ts";

export interface SessionState {
  readonly accountState: ProductAccountState;
  readonly readyAccount: ReadyAdminAccount | null;
  readonly hostChainSupport: ChainSupport | null;
  readonly chainSubmitGrant: RemotePermissionOutcome | null;
  readonly permissionsRetryInFlight: boolean;

  setAccountState(accountState: ProductAccountState): void;
  setPermissions(snapshot: HostPermissionsSnapshot): void;

  requestAccess(): Promise<void>;
  refresh(): Promise<void>;
  retryHostPermissions(): Promise<void>;
}

function mainGenesisHash(): `0x${string}` {
  return resolveNetwork(envConfig.chain.network).mainChain.genesisHash as `0x${string}`;
}

export const useSessionStore = create<SessionState>((set) => ({
  accountState: { kind: "pending" },
  readyAccount: null,
  hostChainSupport: null,
  chainSubmitGrant: null,
  permissionsRetryInFlight: false,

  setAccountState: (accountState) =>
    set({
      accountState,
      readyAccount: accountState.kind === "ready" ? accountState.account : null,
    }),

  setPermissions: (snapshot) =>
    set({
      hostChainSupport: snapshot.hostChainSupport,
      chainSubmitGrant: snapshot.chainSubmitGrant,
    }),

  requestAccess: async () => {
    await requestAccessHostWallet("Request W3sPay admin access");
  },

  refresh: async () => {
    await retryHostWallet();
  },

  retryHostPermissions: async () => {

    set({ permissionsRetryInFlight: true });
    try {
      const snapshot = await resolveHostPermissions(mainGenesisHash());
      set({
        hostChainSupport: snapshot.hostChainSupport,
        chainSubmitGrant: snapshot.chainSubmitGrant,
      });
    } finally {
      set({ permissionsRetryInFlight: false });
    }
  },
}));
