// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export {
  JourneyTracker,
  type JourneyOpMap,
  type JourneyTrackerOptions,
  type JourneyAttrValue,
} from "./journey-tracker.ts";
export {
  withSpan,
  breadcrumb,
  captureError,
  type SpanOp,
} from "./sentry-helpers.ts";
export {
  initTelemetry,
  type InitTelemetryOptions,
} from "./init.ts";
export { sentryRemoteOrigins } from "./origins.ts";
export {
  MAX_ATTRIBUTE_LENGTH,
  MAX_EXCEPTION_MESSAGE_LENGTH,
  SENSITIVE_KEY_RE,
  recordJourneyAttribute,
  sanitizeExceptionMessage,
  scrubAttributes,
  beforeSend,
  beforeBreadcrumb,
} from "./scrub.ts";
