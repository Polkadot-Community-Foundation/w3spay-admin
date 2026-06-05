// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { MutationError } from "@features/items/items-mutations.ts";

export function errorMessage(error: MutationError | null): string | null {
  if (!error) return null;
  switch (error.kind) {
    case "duplicate-config-id":
      return `Config ID "${error.id}" already exists. Pick another.`;
    case "invalid-id":
      return "Use lowercase letters, numbers, and dashes only.";
    case "not-found":
      return "Item not found — it may have been deleted elsewhere.";
  }
}
