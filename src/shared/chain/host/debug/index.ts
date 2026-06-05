// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export {
  debugStore,
  type DebugLogLevel,
  type DebugLogRecord,
  type DebugBootEvent,
  type DebugHostSnapshot,
  type DebugStoreState,
  type WalletPhase,
} from "./debug-store.ts";

export {
  installConsoleCapture,
  __uninstallConsoleCaptureForTests,
} from "./console-capture.ts";

export { DebugPanel, type DebugPanelProps } from "./DebugPanel.tsx";
