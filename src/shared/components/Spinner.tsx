// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { COLOR } from "./tokens.ts";

export interface SpinnerProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Accessible label. Defaults to "Loading". */
  label?: string;
}

export function Spinner({
  size = 14,
  color = COLOR.muted,
  strokeWidth = 2,
  label = "Loading",
}: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={{
        display: "inline-block",
        flexShrink: 0,
        animation: "w3-spin 0.9s linear infinite",
      }}
      role="img"
      aria-label={label}
    >
      <path d="M12 3a9 9 0 1 1-6.364 2.636" />
    </svg>
  );
}
