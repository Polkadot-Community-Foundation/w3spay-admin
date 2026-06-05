// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import * as Sentry from "@sentry/react";
import type { Span } from "@sentry/react";

import { recordJourneyAttribute, scrubAttributes } from "./scrub.ts";

type AttrValue = string | number | boolean;

/** Canonical Sentry `op` values for non-journey spans. Centralised so the dashboard's `op` filter stays a closed set. */
export type SpanOp =
  | "chain.read"
  | "chain.write"
  | "bulletin.publish"
  | "host.call"
  | "registry.read";

/**
 * Wrap an async operation in a Sentry span (auto-ends when the promise settles); `attributes`
 * are scrubbed first and errors propagate. Use for one-shot async edges (chain reads, Bulletin
 * uploads); use `JourneyTracker` for multi-step user-facing flows.
 */
export function withSpan<T>(
  name: string,
  op: SpanOp,
  fn: (span: Span) => Promise<T>,
  attributes?: Readonly<Record<string, AttrValue>>,
): Promise<T> {
  const scrubbed = scrubAttributes(attributes);
  return Sentry.startSpan({ name, op, attributes: scrubbed }, async (span) => {
    try {
      return await fn(span);
    } catch (caught) {
      // Re-throw so the caller's error handling runs. Sentry's
      // built-in span-error correlation picks up unhandled throws
      // when tracing is wired; we don't double-capture.
      throw caught;
    }
  });
}

/** Emit a structured breadcrumb; `data` keys are scrubbed. `category` defaults to `"app"` (allow-listed in `beforeBreadcrumb`). */
export function breadcrumb(
  message: string,
  data?: Readonly<Record<string, AttrValue>>,
  category: "app" | "telemetry" | "journey" = "app",
  level: "info" | "warning" | "error" = "info",
): void {
  const scrubbed = scrubAttributes(data);
  Sentry.addBreadcrumb({
    category,
    type: level === "error" ? "error" : "info",
    level,
    message,
    data: scrubbed,
  });
}

/**
 * Send an unhandled error to Sentry with scrubbed context. `tags` are filtered through
 * `recordJourneyAttribute`; `extras` go on `event.extra` and are filtered again by `beforeSend`
 * as defence in depth. Use inside `ErrorBoundary.componentDidCatch` and swallowing catch branches.
 */
export function captureError(
  error: unknown,
  tags?: Readonly<Record<string, AttrValue>>,
  extras?: Readonly<Record<string, unknown>>,
): void {
  // Tag scrubbing is stricter than extra scrubbing — tags are
  // server-side indexed and show up everywhere. Extras are arbitrary
  // metadata only attached to the single event.
  const safeTags: Record<string, AttrValue> = {};
  if (tags) {
    for (const key of Object.keys(tags)) {
      const value = tags[key];
      if (value === undefined) continue;
      if (recordJourneyAttribute(key, value)) safeTags[key] = value;
    }
  }
  Sentry.captureException(error, {
    tags: safeTags,
    extra: extras as Record<string, unknown> | undefined,
  });
}
