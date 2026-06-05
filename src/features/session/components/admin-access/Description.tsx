// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";

import { COLOR } from "@shared/components/tokens.ts";

export function Description({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.5, marginTop: 8 }}>
      {children}
    </div>
  );
}
