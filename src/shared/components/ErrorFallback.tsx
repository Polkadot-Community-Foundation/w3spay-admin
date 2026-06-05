// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { ARail, AFrame, APrimary } from "./primitives.tsx";
import { COLOR, FONT } from "./tokens.ts";

export function ErrorFallback() {
  return (
    <div className="workspace">
      <AFrame header={<ARail title="W3sPay" subtitle="admin" />}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "40px 4px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT.serif, fontSize: 20 }}>
            Something went wrong
          </div>
          <div style={{ color: COLOR.muted, fontSize: 13, lineHeight: 1.6 }}>
            The console hit an unexpected error and stopped. Reloading
            usually clears it. If it keeps happening, the issue has been
            reported automatically.
          </div>
          <div style={{ marginTop: 8 }}>
            <APrimary onClick={() => window.location.reload()} full={false}>
              Reload
            </APrimary>
          </div>
        </div>
      </AFrame>
    </div>
  );
}
