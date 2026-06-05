# Deploying W3sPay Admin Prototype

One command builds the admin SPA and publishes the configured `.dot` product:

```bash
npm run deploy
```

The deploy wrapper validates the environment, builds the Vite app, copies the
dot.li manifest into `dist/`, and hands the publish to `bulletin-deploy`. It does
**not** deploy the registry contract; use the fresh-registry step below when you
need a new `W3SPayMerchantRegistry`.

---

## Prerequisites

| Need | Why |
| --- | --- |
| **Node ≥ 22** | Runs Vite, Hardhat, and `bulletin-deploy` |
| **npm** | Installs the root app and nested contracts workspace |
| **A DotNS publisher mnemonic** | Signs the IPFS + DotNS publish for the target product domain |
| **A deployed registry H160** | The SPA refuses to publish without `VITE_W3SPAY_REGISTRY_ADDRESS` |
| **A funded deployer account** | Only needed when deploying a fresh registry contract |

Install root dependencies once:

```bash
npm install
```

`bulletin-deploy` is pinned in the root workspace at the minimum version required
by `deploy.sh` (`0.8.3`).

## 1. Configure the app deploy

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at least:

| Variable | Required | Notes |
| --- | --- | --- |
| `MNEMONIC` or `DOTNS_MNEMONIC` | yes | 12- or 24-word publisher mnemonic. If both are set, they must be identical. |
| `VITE_DOTNS_PRODUCT_DOMAIN` | yes | Target product domain, e.g. `w3spayadmin.dot`. A CLI argument can override it. |
| `VITE_NETWORK` | yes | App chain key: `paseo-next-v2`, `paseo`, or `previewnet`. |
| `VITE_W3SPAY_REGISTRY_ADDRESS` | yes | Deployed `W3SPayMerchantRegistry` H160. The deploy script validates this before building. |
| `VITE_T3RMINAL_BULLETIN_INDEX_ADDRESS` | no | Reports contract address. Empty disables Reports. |
| `VITE_W3SPAY_ADMIN_SENTRY_DSN` | no | Optional production telemetry. Empty uses console-only telemetry. |

`.env.local` is gitignored. Never commit a mnemonic.

## 2. Deploy a fresh registry contract (when needed)

Skip this section if you already have a registry address.

```bash
cd contracts
npm install
cp .env.example .env
```

Edit `contracts/.env` and set:

```bash
DEPLOYER_SEED="twelve or twenty-four word mnemonic ..."
# NETWORK=paseo-next-v2   # optional; default is paseo-next-v2
```

Verify the contract before deploying:

```bash
npm run compile
npm test
```

Deploy to the default pilot chain:

```bash
npm run deploy:paseo-next-v2
```

What happens:

1. Loads `DEPLOYER_SEED` and resolves `NETWORK` / `--env`.
2. Connects to the selected Asset Hub RPC from `src/shared/chain/host/networks.ts`.
3. Ensures the deployer account is mapped for pallet-revive.
4. Dry-runs `ReviveApi.instantiate` and submits `pallet_revive::instantiate_with_code`.
5. Writes deployment artifacts under `contracts/deployments/<network>/`.
6. Upserts `VITE_NETWORK` and `VITE_W3SPAY_REGISTRY_ADDRESS` into `../.env.local`.
7. If a sibling `../w3spay` checkout exists, updates that app's `.env.local` too.

The deployer H160 becomes the registry owner and first admin.

## 3. Publish the admin SPA

From the repo root:

```bash
npm run deploy
```

To override the target domain for one run:

```bash
npm run deploy -- my-admin-domain.dot
```

The script resolves the domain in this order:

1. CLI argument (`npm run deploy -- my-admin-domain.dot`)
2. `VITE_DOTNS_PRODUCT_DOMAIN` in the shell
3. `VITE_DOTNS_PRODUCT_DOMAIN` in `.env.production.local`, `.env.production`, `.env.local`, or `.env`

What happens:

1. Checks `bulletin-deploy` is available and at least `0.8.3`.
2. Loads `MNEMONIC` / `DOTNS_MNEMONIC` from the shell or env files.
3. Validates `VITE_W3SPAY_REGISTRY_ADDRESS` is a `0x`-prefixed 40-hex-character H160.
4. Defaults `VITE_NETWORK` to `BULLETIN_ENV` when unset.
5. Blocks if `VITE_NETWORK` and `BULLETIN_ENV` differ.
6. Runs `npm run build`.
7. Copies `bundle/manifest.toml` into `dist/manifest.toml`.
8. Runs `bulletin-deploy --publish --env "$BULLETIN_ENV" --mnemonic ... dist <domain>`.
9. Prints the final gateway URL, e.g. `https://w3spayadmin.dot.li`.

## Networks

Default deploy target: `paseo-next-v2`.

Supported app keys:

| Key | Use |
| --- | --- |
| `paseo-next-v2` | Default pilot environment. |
| `paseo` | Regular Paseo Asset Hub + Bulletin Chain endpoints. |
| `previewnet` | Previewnet endpoints; useful for rebuilt test environments. |

For publish, `VITE_NETWORK` must match `BULLETIN_ENV`:

```bash
VITE_NETWORK=paseo-next-v2 BULLETIN_ENV=paseo-next-v2 npm run deploy
```

For networks with moving genesis hashes, set runtime overrides:

```bash
VITE_CHAIN_GENESIS_HASH=0x... \
VITE_BULLETIN_GENESIS_HASH=0x... \
npm run deploy
```

## Admin access after deploy

The registry owner grants additional admin accounts by H160:

```bash
cd contracts
export W3SPAY_ADMIN=0x...
npm run registry:add-admin
# Non-default network:
NETWORK=previewnet npm run registry:add-admin
# or: npm run registry:add-admin -- --env previewnet
```

The admin app's first screen shows the H160 to grant. After the transaction lands,
ask the operator to tap **Check again**.

## Non-interactive / CI

Set secrets in CI and run the same deploy command:

```bash
DOTNS_MNEMONIC="$DOTNS_MNEMONIC" \
VITE_DOTNS_PRODUCT_DOMAIN=w3spayadmin.dot \
VITE_NETWORK=paseo-next-v2
VITE_W3SPAY_REGISTRY_ADDRESS=0x... \
npm run deploy
```

Keep generated contract deployment artifacts (`contracts/deployments/<network>/`)
if you want an auditable address history. Do not commit `.env.local` or
`contracts/.env`.

## Re-running

The app deploy is stateless: each run rebuilds `dist/`, copies the manifest, and
publishes the current bundle. Re-running does not redeploy the registry contract.

The registry deploy writes a new deployment under `contracts/deployments/<network>/`
and updates `.env.local` with the latest address. Existing registry deployments are
not upgraded in place.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `bulletin-deploy is required` | Run `npm install` at the repo root so `node_modules/.bin/bulletin-deploy` exists. |
| `bulletin-deploy 0.8.3 or newer is required` | Reinstall root dependencies; the root package pins `bulletin-deploy@0.8.3`. |
| `no mnemonic found` | Export `MNEMONIC` / `DOTNS_MNEMONIC`, or add one to `.env.local`. |
| `DOTNS_MNEMONIC and MNEMONIC ... contain different values` | Unset the stale one, or make the env-file values identical. |
| `VITE_W3SPAY_REGISTRY_ADDRESS is not set` | Deploy the registry or copy the existing registry H160 into `.env.local`. |
| `not a valid H160 address` | Use the 20-byte pallet-revive contract address: `0x` plus exactly 40 hex characters. |
| `VITE_NETWORK ... must match BULLETIN_ENV` | Set both variables to the same supported network before publishing. |
| Build fails before publish | Run `npm run typecheck` locally and fix the TypeScript / Vite error first. |
| Publish is rejected by DotNS / Bulletin | Use the mnemonic that owns or is allowed to publish the target `.dot` domain. |
