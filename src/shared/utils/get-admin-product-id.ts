// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { envConfig } from "@/config";

export function getAdminProductIdentifier(): string {
  if (typeof window === "undefined" || !window.location) return envConfig.host.productDotNs;
  const { hostname, host } = window.location;
  if (hostname === "localhost") return host;
  if (hostname.endsWith(".dot.li")) return hostname.slice(0, -3);
  if (hostname.endsWith(".dot")) return hostname;
  return envConfig.host.productDotNs;
}
