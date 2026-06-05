// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { ACard, AEye, APrimary, ASecondary } from "@shared/components/primitives.tsx";
import { COLOR } from "@shared/components/tokens.ts";
import { AdminAccountCard } from "./AdminAccountCard.tsx";
import { Description } from "./Description.tsx";
import type { AdminAccessProps } from "./types.ts";

export function AccessBody(props: AdminAccessProps) {
  const { variant } = props;

  if (variant.kind === "outside-host") {
    return (
      <ACard padding={16}>
        <AEye>Host required</AEye>
        <Description>
          Open this app inside the Polkadot host (dotli, Polkadot Desktop,
          or the Polkadot mobile app) to sign in.
        </Description>
      </ACard>
    );
  }

  if (variant.kind === "pending" || variant.kind === "requesting" || variant.kind === "resolving") {
    return (
      <ACard padding={16}>
        <AEye>Connecting</AEye>
        <Description>
          {variant.kind === "requesting"
            ? "Approve the sign-in request in your wallet."
            : "Signing you in…"}
        </Description>
      </ACard>
    );
  }

  if (variant.kind === "disconnected") {
    return (
      <ACard padding={16}>
        <AEye>Sign in required</AEye>
        <Description>
          Sign in to get your account address, then send it to your
          administrator to be granted access before you can manage
          merchants.
        </Description>
        <div style={{ height: 12 }} />
        <APrimary onClick={props.onRequestAccess}>Request access</APrimary>
      </ACard>
    );
  }

  if (variant.kind === "checking-admin") {
    return (
      <>
        <ACard padding={16}>
          <AEye>Checking access</AEye>
          <Description>
            You're signed in. Checking whether your account has
            access…
          </Description>
          <div style={{ height: 12 }} />
          <ASecondary onClick={props.onCheckAgain} disabled={props.checkInFlight}>
            {props.checkInFlight ? "Checking…" : "Check again"}
          </ASecondary>
        </ACard>
        <div style={{ height: 12 }} />
        <AdminAccountCard identity={variant.identity} title="Your account" />
      </>
    );
  }

  if (variant.kind === "registry-config-error") {
    return (
      <>
        <ACard padding={16}>
          <AEye color={COLOR.redSoft}>Registry not configured</AEye>
          <Description>
            {variant.reason} Set <code>VITE_W3SPAY_REGISTRY_ADDRESS</code> in
            the admin app environment and reload.
          </Description>
        </ACard>
        {variant.identity ? (
          <>
            <div style={{ height: 12 }} />
            <AdminAccountCard identity={variant.identity} title="Your account" />
          </>
        ) : null}
      </>
    );
  }

  if (variant.kind === "registry-error") {
    return (
      <>
        <ACard padding={16}>
          <AEye color={COLOR.redSoft}>Could not verify access</AEye>
          <Description>{variant.reason}</Description>
          <div style={{ height: 12 }} />
          <ASecondary onClick={props.onCheckAgain}>Try again</ASecondary>
        </ACard>
        {variant.identity ? (
          <>
            <div style={{ height: 12 }} />
            <AdminAccountCard identity={variant.identity} title="Your account" />
          </>
        ) : null}
      </>
    );
  }

  if (variant.kind === "host-transport-unavailable") {
    return (
      <>
        <ACard padding={16}>
          <AEye color={COLOR.redSoft}>Host unavailable</AEye>
          <Description>
            The Polkadot host isn't responding.
            {variant.reason ? ` ${variant.reason}.` : ""} Reopen this app from
            the host (dotli, Polkadot Desktop, or the mobile app) and try
            again.
          </Description>
          <div style={{ height: 12 }} />
          <ASecondary
            onClick={props.onRetryHostPermissions}
            disabled={props.permissionsRetryInFlight}
          >
            {props.permissionsRetryInFlight ? "Retrying…" : "Retry"}
          </ASecondary>
        </ACard>
        {variant.identity ? (
          <>
            <div style={{ height: 12 }} />
            <AdminAccountCard identity={variant.identity} title="Your account" />
          </>
        ) : null}
      </>
    );
  }

  if (variant.kind === "chain-submit-denied") {
    return (
      <>
        <ACard padding={16}>
          <AEye color={COLOR.redSoft}>Permission needed</AEye>
          <Description>
            The host denied permission to submit transactions.
            {variant.reason ? ` ${variant.reason}.` : ""} Grant the permission
            to register or update merchants.
          </Description>
          <div style={{ height: 12 }} />
          <APrimary
            onClick={props.onRetryHostPermissions}
            disabled={props.permissionsRetryInFlight}
          >
            {props.permissionsRetryInFlight ? "Requesting…" : "Re-request permission"}
          </APrimary>
        </ACard>
        <div style={{ height: 12 }} />
        <AdminAccountCard identity={variant.identity} title="Your account" />
      </>
    );
  }

  if (variant.kind === "error") {
    return (
      <ACard padding={16}>
        <AEye color={COLOR.redSoft}>Could not load your account</AEye>
        <Description>{variant.reason}</Description>
        <div style={{ height: 12 }} />
        <ASecondary onClick={props.onCheckAgain}>Try again</ASecondary>
      </ACard>
    );
  }

  return (
    <>
      <ACard padding={16}>
        <AEye>Not yet authorized</AEye>
        <Description>
          You're signed in, but this account doesn't have access yet.
          Send the address below to your administrator. Once they've
          granted access, press <strong>Check again</strong>.
        </Description>
      </ACard>

      <div style={{ height: 12 }} />

      <AdminAccountCard
        identity={variant.identity}
        title="Send this address to your administrator"
      />

      <div style={{ height: 16 }} />
      <APrimary onClick={props.onCheckAgain} disabled={props.checkInFlight}>
        {props.checkInFlight ? "Checking…" : "Check again"}
      </APrimary>
    </>
  );
}
