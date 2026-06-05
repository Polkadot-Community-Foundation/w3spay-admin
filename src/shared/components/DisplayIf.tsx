// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";

export interface DisplayIfProps {
  readonly condition: boolean;
  readonly children: ReactNode;
  /** Rendered when `condition` is false. Defaults to nothing. */
  readonly fallback?: ReactNode;
}

export function DisplayIf({ condition, children, fallback = null }: DisplayIfProps) {
  return <>{condition ? children : fallback}</>;
}
