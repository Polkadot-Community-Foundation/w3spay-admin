// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useMemo } from "react";

import type { TxStatus } from "@/shared/chain/contracts/index.ts";

import { addMerchant } from "./add-merchant.ts";
import { deleteMerchant } from "./delete-merchant.ts";
import { setMerchantDestination } from "./set-merchant-destination.ts";
import { setMerchantStatus } from "./set-merchant-status.ts";
import { updateMerchant } from "./update-merchant.ts";
import type { MerchantRegistryActions } from "@features/merchant/merchant-registry-types.ts";
import type { RegistryMerchantRow } from "@features/merchant/merchant-model.ts";
import {
  applyDelete,
  applyRegister,
  applySetDestination,
  applySetStatus,
  applyUpdate,
  synthesizeTxHash,
} from "@shared/lib/demo/demo-actions.ts";
import { getDemoMerchantRows, setDemoMerchantRows } from "@shared/lib/demo/demo-merchant-registry.ts";
import { isDemoMode } from "@shared/lib/demo/demo-mode.ts";
import type { ReadyAdminAccount } from "@features/session/account.ts";
import { queryRoots } from "@shared/chain/keys.ts";
import { queryClient } from "@shared/chain/query-client.ts";

async function invalidateRegistry(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: queryRoots.merchantRegistry });
}

/** Drive the full `TxStatus` lifecycle on a microtask so demo writes emit the same sequence a real chain watcher would. */
function emitStatusLifecycle(onStatus?: (status: TxStatus) => void): Promise<void> {
  if (onStatus == null) return Promise.resolve();
  const { promise, resolve } = Promise.withResolvers<void>();
  queueMicrotask(() => {
    onStatus("preparing");
    onStatus("signing");
    onStatus("broadcasting");
    onStatus("in-block");
    onStatus("finalized");
    resolve();
  });
  return promise;
}

async function demoWrite(
  reduce: (rows: ReadonlyArray<RegistryMerchantRow>) => ReadonlyArray<RegistryMerchantRow>,
  onStatus?: (status: TxStatus) => void,
): Promise<string> {
  await emitStatusLifecycle(onStatus);
  setDemoMerchantRows(reduce(getDemoMerchantRows()));
  await invalidateRegistry();
  return synthesizeTxHash();
}

async function chainWrite(write: () => Promise<string>): Promise<string> {
  const txHash = await write();
  await invalidateRegistry();
  return txHash;
}

/**
 * Build the write actions for the signed-in account, or `null` in real mode when no
 * account is ready (`canWrite` derives from this). Demo mode always returns actions.
 */
export function useMerchantActions(
  account: ReadyAdminAccount | null,
): MerchantRegistryActions | null {
  return useMemo<MerchantRegistryActions | null>(() => {
    if (isDemoMode()) {
      return {
        registerMerchant: (payload, onStatus) =>
          demoWrite((rows) => applyRegister(rows, payload, Date.now()), onStatus),
        updateMerchant: (payload, onStatus) =>
          demoWrite((rows) => applyUpdate(rows, payload, Date.now()), onStatus),
        deleteMerchant: (payload, onStatus) =>
          demoWrite((rows) => applyDelete(rows, payload), onStatus),
        setMerchantStatus: (payload, onStatus) =>
          demoWrite((rows) => applySetStatus(rows, payload, Date.now()), onStatus),
        setMerchantDestination: (payload, onStatus) =>
          demoWrite((rows) => applySetDestination(rows, payload, Date.now()), onStatus),
      };
    }
    if (account == null) return null;
    const context = { signer: account.signer, walletAddress: account.ss58Address };
    return {
      registerMerchant: (payload, onStatus) =>
        chainWrite(() => addMerchant({ context, payload, onStatus })),
      updateMerchant: (payload, onStatus) =>
        chainWrite(() => updateMerchant({ context, payload, onStatus })),
      deleteMerchant: (payload, onStatus) =>
        chainWrite(() => deleteMerchant({ context, payload, onStatus })),
      setMerchantStatus: (payload, onStatus) =>
        chainWrite(() => setMerchantStatus({ context, payload, onStatus })),
      setMerchantDestination: (payload, onStatus) =>
        chainWrite(() => setMerchantDestination({ context, payload, onStatus })),
    };
  }, [account]);
}
