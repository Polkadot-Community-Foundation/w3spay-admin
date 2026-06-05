// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

/**
 * `AuthedLayout` overlays `<AdminAccess>` / `<RegistryShell>` in place —
 * NOT a redirect — so granting access lands on the underlying route.
 */

import { Outlet } from "@tanstack/react-router";

import { resolveAccessVariant } from "@features/session/contracts/resolve-access-variant.ts";
import { useSession } from "@features/session/contracts/use-session.ts";
import { useMerchants } from "@features/merchant/contracts/use-merchants.ts";
import { AdminAccess, type AccessVariant } from "@features/session/pages/AdminAccess.tsx";
import { RegistryShell } from "@features/session/pages/RegistryShell.tsx";

export interface GateVerdict {
  readonly isAdmin: boolean;
  readonly accessVariant: AccessVariant;
  readonly registryReady: boolean;
}

export function useGateVerdict(): GateVerdict {
  const { adminAccount, readyAccount, hostChainSupport, chainSubmitGrant } = useSession();
  const { registry } = useMerchants();

  const accessVariant = resolveAccessVariant({
    accountState: adminAccount.state,
    registry,
    isAdmin: adminAccount.isAdmin,
    hostChainSupport,
    chainSubmitGrant,
  });
  const isAdmin =
    readyAccount != null &&
    adminAccount.isAdmin.granted &&
    (hostChainSupport == null || hostChainSupport.kind !== "unavailable") &&
    (chainSubmitGrant == null || chainSubmitGrant.granted === true);

  return { isAdmin, accessVariant, registryReady: registry.kind === "ready" };
}

export function AuthedLayout() {
  const { isAdmin, accessVariant } = useGateVerdict();
  const { registry } = useMerchants();

  if (!isAdmin) return <Gate variant={accessVariant} />;
  if (registry.kind !== "ready") return <RegistryShell registry={registry} />;
  return <Outlet />;
}

function Gate({ variant }: { variant: AccessVariant }) {
  const { adminAccount, permissionsRetryInFlight, retryHostPermissions } = useSession();
  const { registry, refreshMerchantEntries } = useMerchants();
  return (
    <AdminAccess
      variant={variant}
      onRequestAccess={() => {
        void adminAccount.requestAccess();
      }}
      onCheckAgain={() => {
        void (async () => {
          await adminAccount.refresh();
          await adminAccount.isAdmin.refresh();
          if (registry.kind === "error" || registry.kind === "config-error") {
            await refreshMerchantEntries();
          }
        })();
      }}
      onRetryHostPermissions={() => {
        void retryHostPermissions();
      }}
      checkInFlight={adminAccount.isAdmin.inFlight}
      permissionsRetryInFlight={permissionsRetryInFlight}
    />
  );
}
