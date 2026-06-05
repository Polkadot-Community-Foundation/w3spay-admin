// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const { promise: timeout, reject } = Promise.withResolvers<never>();
  const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}
