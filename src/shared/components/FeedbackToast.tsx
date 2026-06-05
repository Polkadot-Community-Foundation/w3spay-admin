// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import { useFeedbackStore } from "@shared/store/use-feedback-store.ts";
import { AToast } from "./Toast.tsx";

export function FeedbackToast() {
  const toast = useFeedbackStore((s) => s.toast);
  return (
    <AToast
      message={toast?.msg ?? null}
      tone={toast?.tone ?? "ok"}
      loading={toast?.loading ?? false}
    />
  );
}
