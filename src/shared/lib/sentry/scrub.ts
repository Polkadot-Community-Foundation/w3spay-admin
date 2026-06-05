// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

/**
 * Privacy guards for telemetry. w3spay handles money: every attribute, breadcrumb, and event
 * header that crosses the Sentry boundary is filtered here. Contract (docs/prds/w3spay.md):
 * "Nobody who isn't part of the transaction can tell that customer X paid shop Y."
 *
 * Refusals `console.error` but NEVER throw — telemetry is best-effort; crashing the payment
 * flow over a typo'd attribute key is a worse failure mode than a missing data point.
 */

import type {
  Breadcrumb,
  BreadcrumbHint,
  ErrorEvent,
  EventHint,
} from "@sentry/react";

/**
 * Keys whose presence on a Sentry attribute / tag / breadcrumb data
 * field MUST trigger a refusal. Updated when a new PII vector lands.
 */
export const SENSITIVE_KEY_RE =
  /destination|merchant|terminal|payment_?id|tx_?hash|amount|kassen|raw|address|account|signer|wallet|public_?key|secret|email|phone|user_?id/i;

/**
 * Max string length for any forwarded attribute value. SS58 is 47 chars, H160 42, a TSE
 * deeplink hundreds; 32 fits categorical labels (`"balance-low"`, `"tse-valid"`) while
 * catching any accidental address-literal leak.
 */
export const MAX_ATTRIBUTE_LENGTH = 32;

/**
 * Max exception-message length forwarded to Sentry. Messages from libraries we don't control
 * (PAPI dispatch, IPFS fetch, ethers ABI) can embed contract addresses, calldata hex, and
 * gateway URLs; 240 fits a categorical message and truncates the runaway stringified-data tail.
 */
export const MAX_EXCEPTION_MESSAGE_LENGTH = 240;

/**
 * Patterns redacted from an exception message before the event leaves the device; each
 * collapses the match to a fixed placeholder so the dashboard keeps the SHAPE without the
 * payload. Ordered most-specific first — `0x` hex blobs are the most common leak vector
 * (addresses, accountId hex, calldata, tx hashes); SS58 comes from host-SDK account
 * formatting; URLs come from `fetch` exceptions and IPFS gateways.
 */
const EXCEPTION_REDACTORS: ReadonlyArray<readonly [RegExp, string]> = [
  // 0x-prefixed hex blobs, ≥ 8 chars. Catches H160 (40), AccountId32
  // (64), tx hash (64), and any calldata fragment.
  [/0x[0-9a-fA-F]{8,}/g, "0x«hex»"],
  // SS58 — base58 string starting with 1-9 (no leading zero) with the
  // length range Polkadot uses (47-49 chars). Crude but precise enough.
  [/\b[1-9A-HJ-NP-Za-km-z]{45,50}\b/g, "«ss58»"],
  // CIDs — start with `bafy` (CIDv1) or `Qm` (CIDv0).
  [/\b(?:bafy[0-9a-z]+|Qm[1-9A-HJ-NP-Za-km-z]{44})\b/g, "«cid»"],
  // Full URLs (any scheme). Keeps the scheme so the dashboard knows
  // whether it was an http or ws failure.
  [/(https?|wss?):\/\/[^\s"']+/g, "$1://«url»"],
];

/** Run the redactors + length cap over an exception message. Pure; also exposed so call sites can sanitize their own error strings. */
export function sanitizeExceptionMessage(message: string): string {
  let out = message;
  for (const [pattern, replacement] of EXCEPTION_REDACTORS) {
    out = out.replace(pattern, replacement);
  }
  if (out.length > MAX_EXCEPTION_MESSAGE_LENGTH) {
    out = `${out.slice(0, MAX_EXCEPTION_MESSAGE_LENGTH)}…`;
  }
  return out;
}

/** Categorical / numeric / boolean values are the only thing we accept. */
type JourneyAttrPrimitive = string | number | boolean;

/**
 * Validate a key/value before it lands on a Sentry attribute. Returns `true` when safe,
 * `false` (with a logged refusal) otherwise. NEVER throws — telemetry must not crash the host.
 */
export function recordJourneyAttribute(
  key: string,
  value: JourneyAttrPrimitive,
): boolean {
  if (SENSITIVE_KEY_RE.test(key)) {
    refuse(`refused attribute "${key}" (matches SENSITIVE_KEY_RE)`);
    return false;
  }
  if (typeof value === "string" && value.length > MAX_ATTRIBUTE_LENGTH) {
    refuse(
      `refused attribute "${key}" — value length ${value.length} > ${MAX_ATTRIBUTE_LENGTH}`,
    );
    return false;
  }
  return true;
}

/**
 * Filtered copy of `attributes`: keys matching `SENSITIVE_KEY_RE` and over-long string values
 * are dropped, with a logged refusal. Never throws.
 */
export function scrubAttributes(
  attributes: Readonly<Record<string, JourneyAttrPrimitive>> | undefined,
): Record<string, JourneyAttrPrimitive> {
  const out: Record<string, JourneyAttrPrimitive> = {};
  if (!attributes) return out;
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (value === undefined) continue;
    if (recordJourneyAttribute(key, value)) out[key] = value;
  }
  return out;
}

// `Sentry.init({ beforeSend })` only fires for error events; transactions
// use the separate `beforeSendTransaction` hook (we don't install one
// because our spans are pre-scrubbed at the `JourneyTracker` layer).

/**
 * `Sentry.init({ beforeSend })` hook. Strips identifying request metadata and tag/extra keys
 * matching `SENSITIVE_KEY_RE`. Never returns `null` — events must still reach Sentry, just
 * with the PII removed.
 */
export function beforeSend(
  event: ErrorEvent,
  _hint: EventHint,
): ErrorEvent | null {
  // Request metadata: URL + query string leak terminal id, kassen
  // serial, dest hex if any of those ever ended up in routing.
  const request = event.request;
  if (request) {
    delete request.url;
    delete request.query_string;
    const headers = request.headers;
    if (headers) {
      delete headers["Referer"];
      delete headers["referer"];
      delete headers["Cookie"];
      delete headers["cookie"];
    }
  }
  // User: IP / email / username all leak by design.
  const user = event.user;
  if (user) {
    delete user.ip_address;
    delete user.email;
    delete user.username;
  }
  // Tags: caller-supplied bag — drop sensitive keys outright.
  const tags = event.tags;
  if (tags) {
    for (const key of Object.keys(tags)) {
      if (SENSITIVE_KEY_RE.test(key)) delete tags[key];
    }
  }
  // Extra: free-form, same filter.
  const extra = event.extra;
  if (extra) {
    for (const key of Object.keys(extra)) {
      if (SENSITIVE_KEY_RE.test(key)) delete extra[key];
    }
  }
  // Exception messages: free-form strings from third-party code, the most likely PII leak
  // vector. Run each through the redactors so the hex/ss58 customer-id values are scrubbed
  // (the categorical `merchant` token itself isn't PII).
  const exception = event.exception;
  if (exception?.values) {
    for (const value of exception.values) {
      if (typeof value.value === "string") {
        value.value = sanitizeExceptionMessage(value.value);
      }
    }
  }
  // Same treatment for the top-level message set by `captureMessage`.
  if (typeof event.message === "string") {
    event.message = sanitizeExceptionMessage(event.message);
  }
  return event;
}

/**
 * Allowed breadcrumb categories; anything else is dropped before reaching Sentry. The default
 * categories (`console`, `xhr`, `fetch`, `navigation`, `ui.click`) all leak in subtle ways — a
 * fetch URL holds the registry contract address, `ui.click` carries DOM text like "Pay 4.20
 * CASH to <merchant>". Our own crumbs come through the typed `breadcrumb()` helper.
 */
const ALLOWED_BREADCRUMB_CATEGORIES: ReadonlySet<string> = new Set([
  "journey",
  "telemetry",
  "app",
]);

/**
 * `Sentry.init({ beforeBreadcrumb })` hook. Allow-list: drop everything
 * we didn't explicitly emit.
 */
export function beforeBreadcrumb(
  breadcrumb: Breadcrumb,
  _hint?: BreadcrumbHint,
): Breadcrumb | null {
  const category = breadcrumb.category;
  if (category == null) return null;
  if (!ALLOWED_BREADCRUMB_CATEGORIES.has(category)) return null;
  return breadcrumb;
}

/**
 * Log a refusal — always `console.error` so the offending key + reason is impossible to miss
 * in dev. NEVER throws: attribute names sometimes brush the regex by coincidence (e.g.
 * `boot.merchant_table_source` carries a categorical label, not a merchant id), and crashing
 * the app over an observability false positive is far worse than dropping the attribute.
 */
function refuse(message: string): void {
  console.error(`[telemetry/scrub] ${message}`);
}
