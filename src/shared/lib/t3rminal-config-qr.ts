// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { sha256 } from "@noble/hashes/sha2.js";

import {
  T3RMINAL_CONFIG_QR_UR_TYPE,
  T3RMINAL_CONFIG_QR_VERSION_V1,
  T3RMINAL_CONFIG_QR_VERSION_V2,
  T3RMINAL_REPORT_PASSWORD_SCHEME_V1 as SHARED_REPORT_PASSWORD_SCHEME_V1,
  buildT3rminalConfigQrV2 as sharedBuildT3rminalConfigQrV2,
  encodeT3rminalConfigQrV2 as sharedEncodeT3rminalConfigQrV2,
  type AdminItemConfigQrConfig,
  type MerchantProfile,
  type EncodedT3rminalConfigQrV2,
  type T3rminalConfigQrPayloadV1 as SharedT3rminalConfigQrPayloadV1,
  type T3rminalConfigQrPayloadV2 as SharedT3rminalConfigQrPayloadV2,
} from "@/shared/lib/config-qr";

import type { AdminMerchant } from "@features/merchant/merchant-model.ts";
import type { ItemConfig } from "@features/items/items-model.ts";

export const T3RMINAL_QR_TYPE = T3RMINAL_CONFIG_QR_UR_TYPE;
export const T3RMINAL_QR_VERSION = T3RMINAL_CONFIG_QR_VERSION_V1;
export const T3RMINAL_QR_VERSION_V2 = T3RMINAL_CONFIG_QR_VERSION_V2;
export const T3RMINAL_REPORT_PASSWORD_SCHEME_V1 = SHARED_REPORT_PASSWORD_SCHEME_V1;

export const T3RMINAL_REPORT_PASSWORD_DOMAIN_V1 = "w3spay:t3rminal-report-password:v1" as const;

export const T3RMINAL_PASSWORD_SALT_BYTES = 16;

/** Byte ceiling for the legacy v1 JSON payload; v2 uses the BCTS density check instead. */
export const T3RMINAL_QR_PAYLOAD_BYTE_LIMIT = 2048;

export type T3rminalConfigQRPayloadV1 = SharedT3rminalConfigQrPayloadV1;
export type T3rminalConfigQRPayloadV2 = SharedT3rminalConfigQrPayloadV2;

export interface BuildT3rminalConfigPayloadArgs {
  readonly merchant: AdminMerchant;
  readonly itemConfigId: string;
  readonly itemConfigCid: string;
  readonly reportPassword: string;
  readonly registryAddress: string;
  readonly issuedAt: string;
}

/** Legacy v1 payload builder, retained for the assignment storage layer and tests. */
export function buildT3rminalConfigPayload(
  args: BuildT3rminalConfigPayloadArgs,
): T3rminalConfigQRPayloadV1 {
  return {
    v: T3RMINAL_CONFIG_QR_VERSION_V1,
    type: T3RMINAL_CONFIG_QR_UR_TYPE,
    merchantKey: args.merchant.key,
    merchantId: args.merchant.merchantId,
    terminalId: args.merchant.terminalId,
    displayName: args.merchant.displayName,
    receivingAddress: args.merchant.destinationSs58,
    passwordScheme: T3RMINAL_REPORT_PASSWORD_SCHEME_V1,
    reportPassword: args.reportPassword,
    itemConfigId: args.itemConfigId,
    itemConfigCid: args.itemConfigCid,
    registryAddress: args.registryAddress,
    issuedAt: args.issuedAt,
  };
}

/** Minified JSON encoding of the legacy v1 payload; production QR generation uses v2. */
export function encodeT3rminalConfigPayload(payload: T3rminalConfigQRPayloadV1): string {
  const json = JSON.stringify(payload);
  const size = TEXT_ENCODER.encode(json).length;
  if (size > T3RMINAL_QR_PAYLOAD_BYTE_LIMIT) {
    throw new Error(
      `T3rminal QR payload too large (${size} bytes; limit ${T3RMINAL_QR_PAYLOAD_BYTE_LIMIT}).`,
    );
  }
  return json;
}

export interface BuildT3rminalConfigPayloadV2Args {
  readonly merchant: AdminMerchant;
  readonly config: ItemConfig;
  readonly reportPassword: string;
  readonly issuedAt: string;
  readonly profile?: MerchantProfile;
}

/** Build the v2 QR payload carrying the full item config inline, so the terminal never fetches from Bulletin. */
export function buildT3rminalConfigPayloadV2(
  args: BuildT3rminalConfigPayloadV2Args,
): T3rminalConfigQRPayloadV2 {
  const adminConfig: AdminItemConfigQrConfig = {
    id: args.config.id,
    name: args.config.name,
    updatedAt: args.config.updatedAt,
    items: args.config.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
    })),
  };
  return sharedBuildT3rminalConfigQrV2({
    merchantKey: args.merchant.key,
    merchantId: args.merchant.merchantId,
    terminalId: args.merchant.terminalId,
    displayName: args.merchant.displayName,
    receivingAddress: args.merchant.destinationSs58,
    reportPassword: args.reportPassword,
    issuedAt: args.issuedAt,
    config: adminConfig,
    profile: args.profile,
  });
}

export function encodeT3rminalConfigPayloadV2(
  payload: T3rminalConfigQRPayloadV2,
): EncodedT3rminalConfigQrV2 {
  return sharedEncodeT3rminalConfigQrV2(payload);
}

export interface PasswordSeed {
  readonly salt: Uint8Array;
  readonly password: string;
}

/** Generate a fresh salt + derive the v1 report password; persist the salt to reproduce it, rotating it rotates the password. */
export function createPasswordSeed(publicKey: Uint8Array): PasswordSeed {
  const salt = new Uint8Array(T3RMINAL_PASSWORD_SALT_BYTES);
  cryptoSource().getRandomValues(salt);
  return { salt, password: deriveReportPassword(publicKey, salt) };
}

/** Derive the v1 report password (base64url of the 32-byte digest) from a product public key and 16-byte salt. Deterministic in its inputs. */
export function deriveReportPassword(publicKey: Uint8Array, salt: Uint8Array): string {
  if (publicKey.length === 0) throw new Error("publicKey is empty");
  if (salt.length === 0) throw new Error("salt is empty");
  const domain = TEXT_ENCODER.encode(T3RMINAL_REPORT_PASSWORD_DOMAIN_V1);
  const total = domain.length + publicKey.length + salt.length;
  const buffer = new Uint8Array(total);
  buffer.set(domain, 0);
  buffer.set(publicKey, domain.length);
  buffer.set(salt, domain.length + publicKey.length);
  const digest = sha256(buffer);
  return base64UrlEncode(digest);
}

/** Base64url encode (RFC 4648 §5, no padding). */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const TEXT_ENCODER = /* @__PURE__ */ new TextEncoder();

function cryptoSource(): Crypto {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return crypto;
  }
  throw new Error("`crypto.getRandomValues` is not available in this runtime.");
}
