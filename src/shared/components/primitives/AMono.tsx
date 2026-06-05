// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";

import { COLOR, FONT } from "@shared/components/tokens.ts";

export interface AMonoProps {
  children: ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  title?: string;
}

export function AMono({ children, size = 13, color, weight = 500, title }: AMonoProps) {
  return (
    <span
      title={title}
      style={{
        fontFamily: FONT.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: size,
        color: color ?? COLOR.text,
        fontWeight: weight,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </span>
  );
}
