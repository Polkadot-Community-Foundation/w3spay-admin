// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { STATUS_COLORS, type MerchantStatus } from "@shared/components/tokens.ts";

export interface AStatusProps {
  status: MerchantStatus;
  size?: "sm" | "md";
}

export function AStatus({ status, size = "sm" }: AStatusProps) {
  const c = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "3px 8px 3px 7px" : "4px 10px 4px 9px",
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        fontSize: size === "sm" ? 10 : 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: c.dot,
          flex: "0 0 auto",
        }}
      />
      {status}
    </span>
  );
}
