// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { initTelemetry, sentryRemoteOrigins } from "@shared/lib/sentry";
import { requestRemoteOriginPermission } from "@shared/chain/host/connection.ts";

import { envConfig } from "@/config";

const { telemetry } = envConfig;

if (telemetry.enabled) {
  initTelemetry({
    dsn: telemetry.dsn,
    app: "w3spay-admin",
    environment: telemetry.environment,
    tracesSampleRate: telemetry.tracesSampleRate,
  });
  void requestRemoteOriginPermission(sentryRemoteOrigins(telemetry.dsn));
} else {
  console.info("[w3spay-admin/telemetry] disabled via config.telemetry.enabled");
}
