// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { COLOR } from "./tokens.ts";

export function DemoModeBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "8px 14px",
        // Solid amber-tinted background so the sticky banner does NOT
        // visually blend with header chrome scrolling behind it.
        background: "#221a0c",
        borderBottom: `1px solid ${COLOR.border}`,
        color: COLOR.amberSoft,
        fontSize: 12,
        lineHeight: 1.45,
        textAlign: "center",
        letterSpacing: 0.1,
      }}
    >
      <span style={{ fontWeight: 600, marginRight: 6 }}>Demo mode.</span>
      <span style={{ color: COLOR.text2 }}>
        You're not signed in to a Polkadot host — actions are simulated and never written on-chain.
      </span>
    </div>
  );
}
