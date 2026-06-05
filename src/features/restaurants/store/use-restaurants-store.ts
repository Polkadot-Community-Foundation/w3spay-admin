// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useEffect } from "react";
import { create } from "zustand";

import { cachedAdminKvStore, getAdminKvStore } from "@shared/store/admin-kv.ts";
import {
  LEGACY_MERCHANT_PROFILES_KEY,
  RESTAURANTS_KEY,
  decodeLegacyMerchantProfilesPayload,
  decodeRestaurantsPayload,
  encodeRestaurantsPayload,
  type Restaurant,
  type UseRestaurantsResult,
} from "@features/restaurants/restaurants.ts";

export interface RestaurantsState extends UseRestaurantsResult {
  /** Idempotent across calls. */
  hydrate(): Promise<void>;
}

let hydrating: Promise<void> | null = null;

function persist(next: ReadonlyMap<string, Restaurant>): void {
  const store = cachedAdminKvStore();
  if (store == null) return;
  void store.setJSON(RESTAURANTS_KEY, encodeRestaurantsPayload(next));
}

export const useRestaurantsStore = create<RestaurantsState>((set, get) => ({
  restaurants: new Map(),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    if (hydrating != null) return hydrating;
    hydrating = (async () => {
      const store = await getAdminKvStore();
      if (store == null) {
        set({ hydrated: true });
        return;
      }
      try {
        const raw = await store.getJSON<unknown>(RESTAURANTS_KEY);
        const decoded = decodeRestaurantsPayload(raw);
        if (decoded.size === 0) {
          let legacyMap: ReadonlyMap<string, Restaurant> = new Map();
          try {
            const legacy = await store.getJSON<unknown>(LEGACY_MERCHANT_PROFILES_KEY);
            legacyMap = decodeLegacyMerchantProfilesPayload(legacy);
          } catch (caught) {
            console.warn("[restaurants] legacy migration read failed", caught);
          }
          set({ restaurants: legacyMap });
          if (legacyMap.size > 0) {
            void store.setJSON(RESTAURANTS_KEY, encodeRestaurantsPayload(legacyMap));
          }
        } else {
          set({ restaurants: decoded });
        }
      } catch (caught) {
        console.warn("[restaurants] hydrate failed", caught);
      } finally {
        set({ hydrated: true });
      }
    })();
    return hydrating;
  },

  getRestaurant: (id) => get().restaurants.get(id) ?? null,

  upsertRestaurant: (restaurant) => {
    const next = new Map(get().restaurants);
    next.set(restaurant.id, restaurant);
    set({ restaurants: next });
    persist(next);
  },

  removeRestaurant: (id) => {
    const current = get().restaurants;
    if (!current.has(id)) return;
    const next = new Map(current);
    next.delete(id);
    set({ restaurants: next });
    persist(next);
  },
}));

export function useRestaurants(): UseRestaurantsResult {
  const hydrate = useRestaurantsStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return useRestaurantsStore();
}
