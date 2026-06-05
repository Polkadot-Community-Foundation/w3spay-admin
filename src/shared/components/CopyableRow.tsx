// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";

import { useFeedbackStore } from "@shared/store/use-feedback-store.ts";
import { Icon } from "./Icon.tsx";
import { COLOR, FONT } from "./tokens.ts";

export interface CopyableRowProps {
  readonly label: string;
  /** Stringified value used both for display and clipboard. */
  readonly value: string;
  /** Friendlier rendered form when `value` is the canonical/copyable string. Defaults to `value`. */
  readonly display?: ReactNode;
  readonly mono?: boolean;
  /** Identifier passed to the feedback context for per-row copy state. */
  readonly copyField?: string;
  /** Hide the dashed separator drawn under the row. */
  readonly noBorder?: boolean;
}

export function CopyableRow({
  label,
  value,
  display,
  mono,
  copyField,
  noBorder,
}: CopyableRowProps) {
  const copiedField = useFeedbackStore((s) => s.copiedField);
  const copyValue = useFeedbackStore((s) => s.copyValue);
  const field = copyField ?? label.toLowerCase();
  const copied = copiedField === field;
  const isEmpty = value.trim().length === 0;
  const renderedValue = display ?? (isEmpty ? "—" : value);

  const onClick = () => {
    if (isEmpty) return;
    copyValue(value, field);
  };

  const valueColor = copied
    ? COLOR.greenSoft
    : isEmpty
      ? COLOR.muted
      : COLOR.text2;

  return (
    <div
      onClick={onClick}
      title={isEmpty ? undefined : value}
      role={isEmpty ? undefined : "button"}
      tabIndex={isEmpty ? undefined : 0}
      onKeyDown={(e) => {
        if (isEmpty) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 0",
        borderBottom: noBorder ? "none" : `1px dashed ${COLOR.surface2}`,
        cursor: isEmpty ? "default" : "pointer",
        // Reset the default focus ring — the inner value tint already
        // signals interactivity, and a bright outline would clash with
        // the editorial palette.
        outline: "none",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: COLOR.muted,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontFamily: mono ? FONT.mono : "inherit",
            fontSize: mono ? 11.5 : 12,
            color: valueColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            textAlign: "right",
            transition: "color .15s",
          }}
        >
          {renderedValue}
        </span>
        {isEmpty ? null : (
          <span
            aria-hidden
            style={{
              color: copied ? COLOR.green : COLOR.text3,
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={copied ? "check" : "copy"} size={12} />
          </span>
        )}
      </span>
    </div>
  );
}
