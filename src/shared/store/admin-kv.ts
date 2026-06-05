// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { createTerminalStore, type KvStore } from "@shared/chain/host-environment.ts";

const KV_PREFIX = "w3spay-admin";

let cached: KvStore | null = null;
let creating: Promise<KvStore | null> | null = null;

export function getAdminKvStore(): Promise<KvStore | null> {
  if (cached != null) return Promise.resolve(cached);
  if (creating != null) return creating;
  creating = createTerminalStore(KV_PREFIX)
    .then((store) => {
      cached = store;
      return store;
    })
    .catch((caught) => {
      console.warn("[admin-kv] store init failed", caught);
      return null;
    });
  return creating;
}

export function cachedAdminKvStore(): KvStore | null {
  return cached;
}

export function resetAdminKvStore(): void {
  cached = null;
  creating = null;
}
