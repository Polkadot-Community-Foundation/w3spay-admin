// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

// Manual pagination (not infinite scroll): progressive decrypts can prepend
// rows above the viewport without yanking the operator's place.

import { ASecondary } from "@shared/components/primitives.tsx";
import { COLOR } from "@shared/components/tokens.ts";

export interface LoadMoreFooterProps {
  readonly visible: number;
  readonly total: number;
  readonly pageSize: number;
  readonly onLoadMore: () => void;
}

export function LoadMoreFooter({
  visible,
  total,
  pageSize,
  onLoadMore,
}: LoadMoreFooterProps) {
  const remaining = Math.max(0, total - visible);
  if (remaining === 0) {
    return total > 0 ? (
      <div
        style={{
          marginTop: 10,
          textAlign: "center",
          fontSize: 11,
          color: COLOR.muted,
        }}
      >
        Showing all {total.toLocaleString("en-US")} transaction
        {total === 1 ? "" : "s"}.
      </div>
    ) : null;
  }
  const next = Math.min(pageSize, remaining);
  return (
    <div style={{ marginTop: 10 }}>
      <ASecondary onClick={onLoadMore} full>
        Load {next} more ({remaining.toLocaleString("en-US")} remaining)
      </ASecondary>
    </div>
  );
}
