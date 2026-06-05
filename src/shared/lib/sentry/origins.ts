// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

// No `@sentry/react` import here: keeps the parser trivially testable and usable by the
// host-permission bootstrap, which runs before React mounts.

/**
 * Origins the telemetry transport needs the host to allowlist, derived from the Sentry DSN.
 *
 * A sandboxed Polkadot host blocks outbound HTTP per-origin until granted a `Remote` permission.
 * Sentry's ingest endpoint (the DSN host) is the only origin this transport talks to — replay is
 * disabled and `tracePropagationTargets: []` keeps tracing headers off third-party RPC/Bulletin
 * calls — so the DSN host is the complete allowlist. Returns the bare hostname (the shape the
 * host-API `Remote` codec expects), or `[]` for an empty/unparseable DSN (console-only mode).
 */
export function sentryRemoteOrigins(dsn: string): string[] {
  const trimmed = dsn.trim();
  if (trimmed === "") return [];
  try {
    return [new URL(trimmed).hostname];
  } catch {
    return [];
  }
}
