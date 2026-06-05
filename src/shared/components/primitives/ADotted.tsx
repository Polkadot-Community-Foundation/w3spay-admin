// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { COLOR } from "@shared/components/tokens.ts";

export interface ADottedProps {
  margin?: number;
}

export function ADotted({ margin = 12 }: ADottedProps) {
  return (
    <div
      style={{
        height: 1,
        backgroundImage: `radial-gradient(circle, ${COLOR.faint} 0.7px, transparent 1px)`,
        backgroundSize: "6px 1px",
        backgroundRepeat: "repeat-x",
        margin: `${margin}px 0`,
      }}
    />
  );
}
