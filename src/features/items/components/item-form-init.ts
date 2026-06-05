// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

/**
 * `ItemsTab` remounts on every intra-tab navigation (App.tsx keys the
 * screen wrapper on `routeAnimationKey(route)`), so the route is the
 * single source of truth for the initial form contents — these helpers
 * seed the `useState` initializer on mount. Threading values through
 * navigation callbacks instead silently loses them: the setter would
 * run on the outgoing instance, which unmounts as the route changes.
 */

import type { ItemsView } from "@features/items/pages/ItemsTab.tsx";
import { findItemInConfig, type ItemConfig } from "@features/items/items-model.ts";
import { BLANK_ITEM_FORM, type ItemFormState } from "./ItemsItemForm.tsx";
import { BLANK_NEW_CONFIG, type NewConfigForm } from "./ItemsNewConfig.tsx";

export function itemFormForRoute(
  view: ItemsView,
  configs: ReadonlyArray<ItemConfig>,
): ItemFormState {
  if (view.kind !== "item-edit") return BLANK_ITEM_FORM;
  const config = configs.find((c) => c.id === view.configId);
  const item = config ? findItemInConfig(config, view.itemId) : null;
  if (!item) return BLANK_ITEM_FORM;
  return { id: item.id, name: item.name, price: item.price.toString() };
}

export function duplicateFormForRoute(
  view: ItemsView,
  configs: ReadonlyArray<ItemConfig>,
): NewConfigForm {
  if (view.kind !== "duplicate") return BLANK_NEW_CONFIG;
  const source = configs.find((c) => c.id === view.sourceId);
  if (!source) return BLANK_NEW_CONFIG;
  return { name: `${source.name} (copy)`, id: `${source.id}-copy` };
}
