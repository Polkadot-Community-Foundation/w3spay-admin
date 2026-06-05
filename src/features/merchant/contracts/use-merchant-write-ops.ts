// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useMerchantActions } from "./merchant-mutations.ts";
import { useMerchantWrites } from "./use-merchant-writes.ts";
import { useMerchants } from "./use-merchants.ts";
import type { UseMerchantWritesResult } from "@features/merchant/merchant-registry-types.ts";
import { useFeedbackStore } from "@shared/store/use-feedback-store.ts";
import { useSessionStore } from "@features/session/store/use-session-store.ts";

export interface UseMerchantWriteOpsResult {
  readonly writes: UseMerchantWritesResult;
  /** True when the signed-in account can submit registry writes. */
  readonly canWrite: boolean;
}

export function useMerchantWriteOps(): UseMerchantWriteOpsResult {
  const readyAccount = useSessionStore((s) => s.readyAccount);
  const showToast = useFeedbackStore((s) => s.showToast);
  const { merchants } = useMerchants();
  const actions = useMerchantActions(readyAccount);
  const writes = useMerchantWrites({ actions, merchants, onToast: showToast });
  return { writes, canWrite: actions != null };
}

/** Probe write capability without spinning up the full write-lifecycle state. */
export function useCanWriteMerchants(): boolean {
  const readyAccount = useSessionStore((s) => s.readyAccount);
  return useMerchantActions(readyAccount) != null;
}
