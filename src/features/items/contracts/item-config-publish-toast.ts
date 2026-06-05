// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { showTransactionToast, type TransactionToast } from "@shared/utils/transaction-toast.ts";
import type { TxStatus } from "@shared/chain/contracts/watch-transaction.ts";

export function publishStartToast(onToast: TransactionToast): void {
  onToast("Publishing item configs…", "ok", { loading: true, durationMs: null });
}

export function publishStatusToast(onToast: TransactionToast, status: TxStatus): void {
  showTransactionToast(onToast, status);
}

export function publishSuccessToast(onToast: TransactionToast, count: number): void {
  onToast(`Published ${count} item config${count === 1 ? "" : "s"}`);
}

export function publishFailureToast(onToast: TransactionToast, reason: string): void {
  onToast(`Publish failed: ${reason}`, "warn");
}
