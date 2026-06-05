// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { MerchantProfile } from "@/shared/lib/config-qr";

export const RESTAURANTS_KEY = "restaurants/v1" as const;

export const LEGACY_MERCHANT_PROFILES_KEY = "merchant-profiles/v1" as const;

export interface Restaurant {
  readonly id: string;
  readonly profile: MerchantProfile;
}

export interface RestaurantsPayloadV1 {
  readonly version: 1;
  readonly restaurants: Record<string, MerchantProfile>;
}

export interface RestaurantForm {
  readonly id: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string;
  readonly phone: string;
  readonly taxId: string;
}

export const EMPTY_RESTAURANT_FORM: RestaurantForm = {
  id: "",
  name: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  taxId: "",
};

export function restaurantToForm(restaurant: Restaurant | null | undefined): RestaurantForm {
  if (!restaurant) return EMPTY_RESTAURANT_FORM;
  const p = restaurant.profile;
  return {
    id: restaurant.id,
    name: p.name,
    addressLine1: p.addressLine1 ?? "",
    addressLine2: p.addressLine2 ?? "",
    phone: p.phone ?? "",
    taxId: p.taxId ?? "",
  };
}

export function formToRestaurant(form: RestaurantForm): Restaurant | null {
  const id = form.id.trim();
  const name = form.name.trim();
  if (id.length === 0 || name.length === 0) return null;
  const profile: {
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    phone?: string;
    taxId?: string;
  } = { name };
  const addressLine1 = form.addressLine1.trim();
  if (addressLine1.length > 0) profile.addressLine1 = addressLine1;
  const addressLine2 = form.addressLine2.trim();
  if (addressLine2.length > 0) profile.addressLine2 = addressLine2;
  const phone = form.phone.trim();
  if (phone.length > 0) profile.phone = phone;
  const taxId = form.taxId.trim();
  if (taxId.length > 0) profile.taxId = taxId;
  return { id, profile };
}

export function encodeRestaurantsPayload(
  restaurants: ReadonlyMap<string, Restaurant>,
): RestaurantsPayloadV1 {
  const out: Record<string, MerchantProfile> = {};
  for (const [id, r] of restaurants) out[id] = r.profile;
  return { version: 1, restaurants: out };
}

/**
 * Defensively decode a stored payload. Returns an empty map on any
 * shape mismatch (no throw) so a corrupted KV entry doesn't lock the
 * UI in a broken state — operators just re-enter the restaurant.
 */
export function decodeRestaurantsPayload(raw: unknown): Map<string, Restaurant> {
  if (raw == null || typeof raw !== "object") return new Map();
  const obj = raw as { version?: unknown; restaurants?: unknown };
  if (obj.version !== 1 || obj.restaurants == null || typeof obj.restaurants !== "object") {
    return new Map();
  }
  return profilesRecordToRestaurants(obj.restaurants as Record<string, unknown>);
}

export function decodeLegacyMerchantProfilesPayload(raw: unknown): Map<string, Restaurant> {
  if (raw == null || typeof raw !== "object") return new Map();
  const obj = raw as { version?: unknown; profiles?: unknown };
  if (obj.version !== 1 || obj.profiles == null || typeof obj.profiles !== "object") {
    return new Map();
  }
  return profilesRecordToRestaurants(obj.profiles as Record<string, unknown>);
}

function profilesRecordToRestaurants(
  profiles: Record<string, unknown>,
): Map<string, Restaurant> {
  const out = new Map<string, Restaurant>();
  for (const [id, value] of Object.entries(profiles)) {
    if (id.length === 0) continue;
    const profile = decodeMerchantProfile(value);
    if (profile) out.set(id, { id, profile });
  }
  return out;
}

function decodeMerchantProfile(value: unknown): MerchantProfile | null {
  if (value == null || typeof value !== "object") return null;
  const r = value as Partial<MerchantProfile>;
  if (typeof r.name !== "string" || r.name.length === 0) return null;
  const out: {
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    phone?: string;
    taxId?: string;
  } = { name: r.name };
  if (typeof r.addressLine1 === "string") out.addressLine1 = r.addressLine1;
  if (typeof r.addressLine2 === "string") out.addressLine2 = r.addressLine2;
  if (typeof r.phone === "string") out.phone = r.phone;
  if (typeof r.taxId === "string") out.taxId = r.taxId;
  return out;
}

export interface UseRestaurantsResult {
  readonly restaurants: ReadonlyMap<string, Restaurant>;
  readonly hydrated: boolean;
  getRestaurant(id: string): Restaurant | null;
  upsertRestaurant(restaurant: Restaurant): void;
  removeRestaurant(id: string): void;
}

let pendingPickedRestaurant: { merchantKey: string; restaurantId: string } | null = null;

export const restaurantPickerHint = {
  set(merchantKey: string, restaurantId: string): void {
    pendingPickedRestaurant = { merchantKey, restaurantId };
  },
  consume(merchantKey: string): string | null {
    if (pendingPickedRestaurant == null) return null;
    if (pendingPickedRestaurant.merchantKey !== merchantKey) return null;
    const id = pendingPickedRestaurant.restaurantId;
    pendingPickedRestaurant = null;
    return id;
  },
  clear(): void {
    pendingPickedRestaurant = null;
  },
};
