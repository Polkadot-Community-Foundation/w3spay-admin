#!/usr/bin/env bash
#
# deploy.sh - Build and deploy the W3sPay Admin SPA as a .dot product.
#
# Usage:
#   ./deploy.sh [name-or-domain]
#
# Resolution order: CLI arg > $VITE_DOTNS_PRODUCT_DOMAIN env > .env* files.
#
# Required env:
#   - MNEMONIC or DOTNS_MNEMONIC      Deploying account (12- or 24-word phrase).
#   - VITE_W3SPAY_REGISTRY_ADDRESS    Deployed W3SPayRegistry H160.
#                                     May also live in `.env*`;
#                                     this script enforces it ahead of the build
#                                     so deploys never ship a bundle that boots
#                                     directly into the registry-not-configured
#                                     gate.
#   - VITE_NETWORK                    App chain key. Defaults to BULLETIN_ENV.
#   - VITE_DOTNS_PRODUCT_DOMAIN  Target dot domain (e.g. "w3spayadmin.dot").
#                                May also be supplied as the first CLI arg.
#
# Optional env:
#   - BULLETIN_ENV            polkadot-app-deploy --env id (default: paseo-next-v2;
#                             `summit` for the Summit network). The app chain
#                             (VITE_NETWORK) MUST match this deployment env so
#                             reads, writes, and DotNS all target the same chain.
#   - BULLETIN_DEPLOY_PUBLISH  When `true` (also accepts `1`/`yes`), passes
#                             `--publish` to polkadot-app-deploy so the .dot is
#                             listed in the on-chain Publisher registry on
#                             paseo-next-v2. Defaults to `false` (upload only).
#                             Summit has NO Publisher registry — `--publish` is a
#                             non-fatal no-op there and is never passed.
#
# Follows the deploy conventions and tooling expectations shared across the
# W3sPay pilot surfaces.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"
BULLETIN_ENV="${BULLETIN_ENV:-devnet}"
# `BULLETIN_DEPLOY_PUBLISH` is resolved in two phases: shell env here, .env
# fallback after `_read_envfile_key` is defined. Left empty for now so the
# fallback can tell an unset var from an explicit value; the `false` default
# is applied post-fallback.
BULLETIN_DEPLOY_PUBLISH="${BULLETIN_DEPLOY_PUBLISH:-}"
_read_envfile_key() {
  local file="$1" key="$2" line value
  line="$( (grep -E "^${key}=" "$file" || true) | tail -n 1)"
  [[ -n "$line" ]] || return 1
  value="${line#"${key}="}"
  value="${value#"${value%%[![:space:]]*}"}"   # ltrim
  value="${value%"${value##*[![:space:]]}"}"   # rtrim
  if [[ "$value" == \"*\" ]]; then value="${value#\"}"; value="${value%\"}"; fi
  if [[ "$value" == \'*\' ]]; then value="${value#\'}"; value="${value%\'}"; fi
  value="$(printf '%s' "$value" | tr -s '[:space:]' ' ' | sed -E 's/^ //; s/ $//')"
  [[ -n "$value" ]] && printf '%s' "$value" || return 1
}

TARGET="${1:-${VITE_DOTNS_PRODUCT_DOMAIN:-}}"
if [[ -z "$TARGET" ]]; then
  for _envfile in .env.production.local .env.production .env.local .env; do
    [[ -f "$SCRIPT_DIR/$_envfile" ]] || continue
    TARGET="$(_read_envfile_key "$SCRIPT_DIR/$_envfile" VITE_DOTNS_PRODUCT_DOMAIN || true)"
    if [[ -n "$TARGET" ]]; then
      echo "==> Using VITE_DOTNS_PRODUCT_DOMAIN from ${_envfile}."
      break
    fi
  done
fi


if [[ -z "$TARGET" ]]; then
  echo "Error: no target domain provided."
  echo ""
  echo "Set it via the CLI arg, the VITE_DOTNS_PRODUCT_DOMAIN env var, or in a .env* file."
  echo "  ./deploy.sh w3spayadmin.dot"
  echo "  VITE_DOTNS_PRODUCT_DOMAIN=w3spayadmin.dot ./deploy.sh"
  exit 1
fi

if [[ "$TARGET" != *.dot ]]; then
  TARGET="${TARGET}.dot"
fi

resolve_registry_address() {
  if [[ -n "${VITE_W3SPAY_REGISTRY_ADDRESS:-}" ]]; then
    printf '%s' "$VITE_W3SPAY_REGISTRY_ADDRESS"
    return 0
  fi
  local envfile line value
  for envfile in .env.production.local .env.production .env.local .env; do
    [[ -f "$SCRIPT_DIR/$envfile" ]] || continue
    # `|| true` shields the pipeline from grep's non-zero "no match" exit
    # under `set -o pipefail`. Last entry wins inside a single file so
    # operator overrides at the bottom of the file take effect.
    line="$( (grep -E '^VITE_W3SPAY_REGISTRY_ADDRESS=' "$SCRIPT_DIR/$envfile" || true) | tail -n 1)"
    [[ -n "$line" ]] || continue
    value="${line#VITE_W3SPAY_REGISTRY_ADDRESS=}"
    # Trim surrounding whitespace.
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    # Strip a single layer of surrounding double or single quotes.
    if [[ "$value" == \"*\" ]]; then value="${value#\"}"; value="${value%\"}"; fi
    if [[ "$value" == \'*\' ]]; then value="${value#\'}"; value="${value%\'}"; fi
    if [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
  done
  return 1
}

# Resolve the deploy CLI. Prefer a globally-installed `polkadot-app-deploy`
# (CI installs it once); otherwise fall back to npx with the version pinned.
# The scoped PCF package ships the BUILT-IN `summit` env (all Summit RPCs +
# DotNS addresses + the `https://summit-ipfs.polkadot.io` gateway) and the
# manifest direct-signer fix. The legacy unscoped `bulletin-deploy` is NOT
# used: its repo is gone and it lacks both the Summit env and the manifest fix.
PAD_PKG="@polkadot-community-foundation/polkadot-app-deploy@0.10.1"
if command -v polkadot-app-deploy >/dev/null 2>&1; then
  PAD=(polkadot-app-deploy)
elif command -v pad >/dev/null 2>&1; then
  PAD=(pad)
else
  PAD=(npx -y "$PAD_PKG")
fi



# 1. Normalise shell env vars and check for conflicts.
_dotns_norm="$(printf '%s' "${DOTNS_MNEMONIC:-}" | tr -s '[:space:]' ' ' | sed -E 's/^ //; s/ $//')"
_mnem_norm="$(printf '%s' "${MNEMONIC:-}" | tr -s '[:space:]' ' ' | sed -E 's/^ //; s/ $//')"

if [[ -n "$_dotns_norm" && -n "$_mnem_norm" && "$_dotns_norm" != "$_mnem_norm" ]]; then
  echo "Error: DOTNS_MNEMONIC and MNEMONIC are both set but contain different values."
  echo ""
  echo "This is almost always a stale export. Unset the one you do not want, then re-run:"
  echo "  unset DOTNS_MNEMONIC   # to use the MNEMONIC you just exported"
  echo "  unset MNEMONIC         # to use DOTNS_MNEMONIC instead"
  exit 1
fi

RAW_MNEMONIC="${_dotns_norm:-$_mnem_norm}"

# 2. Fall back to .env files when neither shell var is set.
if [[ -z "$RAW_MNEMONIC" ]]; then
  for _envfile in .env.production.local .env.production .env.local .env; do
    [[ -f "$SCRIPT_DIR/$_envfile" ]] || continue
    _f_dotns="$(_read_envfile_key "$SCRIPT_DIR/$_envfile" DOTNS_MNEMONIC || true)"
    _f_mnem="$(_read_envfile_key "$SCRIPT_DIR/$_envfile" MNEMONIC || true)"
    if [[ -n "$_f_dotns" && -n "$_f_mnem" && "$_f_dotns" != "$_f_mnem" ]]; then
      echo "Error: $_envfile sets both DOTNS_MNEMONIC and MNEMONIC to different values."
      echo "Remove one of them from $_envfile."
      exit 1
    fi
    RAW_MNEMONIC="${_f_dotns:-$_f_mnem}"
    if [[ -n "$RAW_MNEMONIC" ]]; then
      echo "==> Using mnemonic from ${_envfile}."
      break
    fi
  done
fi

# Fall back to .env files when the shell env didn't set BULLETIN_DEPLOY_PUBLISH.
# Mirrors the MNEMONIC .env fallback so a single .env entry drives the publish
# decision without an extra shell export. The `false` default below is applied
# after this block so a truly empty value is still a valid "upload only" run.
if [[ -z "$BULLETIN_DEPLOY_PUBLISH" ]]; then
  for _envfile in .env.production.local .env.production .env.local .env; do
    [[ -f "$SCRIPT_DIR/$_envfile" ]] || continue
    _f_publish="$(_read_envfile_key "$SCRIPT_DIR/$_envfile" BULLETIN_DEPLOY_PUBLISH || true)"
    if [[ -n "$_f_publish" ]]; then
      BULLETIN_DEPLOY_PUBLISH="$_f_publish"
      echo "==> Using BULLETIN_DEPLOY_PUBLISH from ${_envfile}."
      break
    fi
  done
fi
BULLETIN_DEPLOY_PUBLISH="${BULLETIN_DEPLOY_PUBLISH:-false}"

if [[ -z "$RAW_MNEMONIC" ]]; then
  echo "Error: no mnemonic found. Provide one via:"
  echo ""
  echo "  export MNEMONIC=\"your twelve word mnemonic phrase here\""
  echo ""
  echo "  or add MNEMONIC=... to .env.local (gitignored — never commit it)."
  exit 1
fi

WORD_COUNT="$(printf '%s' "$RAW_MNEMONIC" | awk '{print NF}')"
if [[ "$WORD_COUNT" != "12" && "$WORD_COUNT" != "24" ]]; then
  echo "Error: mnemonic has $WORD_COUNT words; expected 12 or 24."
  echo ""
  echo "Re-check the value you exported. The mnemonic must be the exact"
  echo "12- or 24-word phrase your wallet shows, separated by single spaces."
  exit 1
fi

export MNEMONIC="$RAW_MNEMONIC"


RESOLVED_REGISTRY_ADDRESS="$(resolve_registry_address || true)"
if [[ -z "$RESOLVED_REGISTRY_ADDRESS" ]]; then
  echo "Error: VITE_W3SPAY_REGISTRY_ADDRESS is not set."
  echo ""
  echo "Set it in the shell environment before running deploy:"
  echo "  export VITE_W3SPAY_REGISTRY_ADDRESS=0x…"
  echo ""
  echo "Or add it to .env.local (gitignored):"
  echo "  VITE_W3SPAY_REGISTRY_ADDRESS=0x…"
  echo ""
  echo "Use the deployed contract address from:"
  echo "  contracts/ignition/deployments/chain-420420417/deployed_addresses.json"
  echo ""
  echo "Skipping this variable would ship a bundle that lands directly on"
  echo "the registry-not-configured gate."
  exit 1
fi

# H160 shape check — 0x followed by exactly 40 hex characters. The admin
# loader normalizes case at runtime; we only reject obvious typos here.
if ! [[ "$RESOLVED_REGISTRY_ADDRESS" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "Error: VITE_W3SPAY_REGISTRY_ADDRESS=\"$RESOLVED_REGISTRY_ADDRESS\" is not a valid H160 address."
  echo "Expected a 0x-prefixed 40-hex-character string."
  echo "Example: 0xA5e2Fe65C9A80fa246BACf339a0A4f293c1DabEb"
  exit 1
fi

export VITE_W3SPAY_REGISTRY_ADDRESS="$RESOLVED_REGISTRY_ADDRESS"
export VITE_DOTNS_PRODUCT_DOMAIN="$TARGET"
export VITE_NETWORK="${VITE_NETWORK:-$BULLETIN_ENV}"
case "$VITE_NETWORK" in
  paseo|paseo-next-v2|previewnet|summit|devnet) ;;
  *)
    echo "Error: VITE_NETWORK=\"$VITE_NETWORK\" is not supported."
    echo "Expected one of: paseo, paseo-next-v2, previewnet, summit, devnet."
    exit 1
    ;;
esac
if [[ "$VITE_NETWORK" != "$BULLETIN_ENV" ]]; then
  echo "Error: VITE_NETWORK=\"$VITE_NETWORK\" must match BULLETIN_ENV=\"$BULLETIN_ENV\" for deployment."
  echo "Set both to the same network before deploying."
  exit 1
fi
echo "==> Using registry: ${RESOLVED_REGISTRY_ADDRESS}"
echo "==> Using network: ${VITE_NETWORK}"
echo "==> Building W3sPay Admin SPA..."
npm --prefix "$SCRIPT_DIR" run build

echo "==> Copying dot.li manifest..."
cp "$SCRIPT_DIR/bundle/manifest.toml" "$BUILD_DIR/manifest.toml"

if [[ ! -f "$BUILD_DIR/manifest.toml" ]]; then
  echo "Error: manifest.toml was not copied into the build output."
  exit 1
fi

# Resolve the --publish flag. The Publisher (Browse directory) registry only
# exists on paseo-next-v2 — Summit has no Publisher, so --publish is a non-op
# there (a non-fatal skip). Never pass it on summit.
PUBLISH_FLAG=()
if [[ "$BULLETIN_DEPLOY_PUBLISH" == "true" ]]; then
  if [[ "$BULLETIN_ENV" == "summit" ]]; then
    echo "==> Note: --publish requested but ignored on summit (no Publisher registry)."
  else
    PUBLISH_FLAG=(--publish)
  fi
fi

echo ""
echo "==> Deploying ${TARGET} via ${PAD[*]} (BULLETIN_ENV=${BULLETIN_ENV})..."
# --config        : product manifest is auto-discovered by filename, but pass it
#                   explicitly so a future build-dir change can't silently drop it.
# --mnemonic      : routes Bulletin storage signing to DIRECT mode (the signer is
#                   both DotNS owner and upload signer). Without it, uploads ride
#                   the default public pool — unauthorized on Summit.
# --js-merkle     : pure-JS merkleization; skips the Kubo download.
# --no-transfer-to-signedin-user : don't hand a fresh registration to a stale
#                   signed-in identity on the runner/VM.
"${PAD[@]}" \
  "${PUBLISH_FLAG[@]}" \
  --env "$BULLETIN_ENV" \
  --mnemonic "$RAW_MNEMONIC" \
  --config "$SCRIPT_DIR/polkadot-app-deploy.config.ts" \
  --js-merkle \
  --no-transfer-to-signedin-user \
  "$BUILD_DIR" "$TARGET"

