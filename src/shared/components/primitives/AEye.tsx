// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";

import { COLOR } from "@shared/components/tokens.ts";

export interface AEyeProps {
  children: ReactNode;
  color?: string;
}

export function AEye({ children, color }: AEyeProps) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: color ?? COLOR.muted,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}
