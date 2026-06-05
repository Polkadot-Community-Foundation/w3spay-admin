// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

/** Race a promise against a wall-clock timeout. The timer is always cleared;
 *  `label` is woven into the timeout error so callers can tell which request stalled. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
