// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export function envString(key: string, fallback: string): string {
  const value = import.meta.env[key] as string | undefined;
  return value ?? fallback;
}

export function requireEnvString(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (value == null || value === "") {
    throw new Error(
      `${key} is required. Set it in your .env.local (Vite injects every VITE_* variable into import.meta.env at build time).`,
    );
  }
  return value;
}

export function envBigInt(key: string, fallback: string): bigint {
  return BigInt((import.meta.env[key] as string | undefined) ?? fallback);
}

export function envNumber(key: string, fallback: string): number {
  return Number((import.meta.env[key] as string | undefined) ?? fallback);
}

export function envFlag(key: string, fallback: boolean): boolean {
  const raw = import.meta.env[key] as string | undefined;
  if (raw == null) return fallback;
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
