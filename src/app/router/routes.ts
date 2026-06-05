// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { TabItem } from "@shared/components/primitives.tsx";

export type TabId =
  | "merchants"
  | "items"
  | "restaurants"
  | "balances"
  | "reports"
  | "account";

export const TABS: ReadonlyArray<TabItem<TabId>> = [
  { id: "merchants", label: "Merchants" },
  { id: "items", label: "Items" },
  { id: "restaurants", label: "Restaurants" },
  { id: "balances", label: "Balances" },
  { id: "reports", label: "Reports" },
  { id: "account", label: "Account" },
];

export const TAB_DEFAULT_PATH: Record<TabId, string> = {
  merchants: "/merchants",
  items: "/items",
  restaurants: "/restaurants",
  balances: "/balances",
  reports: "/reports",
  account: "/account",
};
