// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import * as Sentry from "@sentry/react";

import { beforeBreadcrumb, beforeSend } from "./scrub.ts";

export interface InitTelemetryOptions {
  /** Sentry DSN. Empty string = console-only mode (no network calls). */
  readonly dsn: string;
  /** App identifier; used as the `app.name` tag and as the `release` prefix when `release` is omitted. */
  readonly app: string;
  /** Sentry environment label (e.g. `"production"`, `"pilot"`, `"dev"`). */
  readonly environment: string;
  /** Traces sample rate (0..1). Default 0.0 — opt-in per call site. */
  readonly tracesSampleRate?: number;
  /**
   * Release identifier (e.g. git sha or app version). Optional — when
   * omitted, events ship without a release association.
   */
  readonly release?: string;
}

export function initTelemetry(options: InitTelemetryOptions): void {
  const dsn = options.dsn.trim();
  Sentry.init({
    dsn: dsn === "" ? undefined : dsn,
    enabled: dsn !== "",
    environment: options.environment,
    release: options.release,
    sendDefaultPii: false,
    tracesSampleRate: options.tracesSampleRate ?? 0.0,
    // Replay would screen-record the confirm flow (mnemonic confirmation,
    // merchant unlock UI). Pin both to 0.0 so a future SDK opt-in can't
    // silently enable it.
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.0,
    // Omit `browserTracingIntegration` so the SDK does not auto-instrument page loads,
    // navigations, fetch, or XHR — each would attach span data containing URLs (third-party
    // RPC, Bulletin gateway, registry address). `tracePropagationTargets: []` is defence in
    // depth: never set `sentry-trace` / `baggage` headers on outgoing RPC calls.
    integrations: [],
    tracePropagationTargets: [],
    beforeSend,
    beforeBreadcrumb,
    initialScope: {
      tags: {
        "app.name": options.app,
        "app.env": options.environment,
      },
    },
  });
}
