// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorFallback } from "@shared/components/ErrorFallback.tsx";
import { queryClient } from "@shared/chain/query-client.ts";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
