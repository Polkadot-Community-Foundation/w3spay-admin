// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export type DebugLogLevel = "log" | "info" | "warn" | "error" | "debug";

export interface DebugLogRecord {
  readonly id: number;
  readonly timestamp: number;
  readonly level: DebugLogLevel;
  readonly message: string;
  readonly source: "console" | "window" | "boot-event" | "manual";
}

export type WalletPhase =
  | "handshake"
  | "connect-host"
  | "inject-extension"
  | "get-product-account"
  | "build-signer"
  | "claim-allowances"
  | "ready"
  | "error";

export interface DebugBootEvent {
  readonly id: number;
  readonly timestamp: number;
  readonly phase: WalletPhase;
  readonly outcome: "start" | "ok" | "error";
  readonly message?: string;
}

export interface DebugHostSnapshot {
  readonly stateKind:
    | "outside-host"
    | "pending"
    | "resolving"
    | "ready"
    | "requesting-access"
    | "error";
  readonly phase?: WalletPhase;
  readonly address?: string;
  readonly errorReason?: string;
  readonly isReady: boolean;
  readonly isInitializing: boolean;
  readonly isOutsideHost: boolean;
  readonly allowanceCount: number;
  readonly environment: "desktop-webview" | "web-iframe" | "standalone";
  readonly updatedAt: number;
}

export interface DebugStoreState {
  readonly logs: readonly DebugLogRecord[];
  readonly bootEvents: readonly DebugBootEvent[];
  readonly hostSnapshot: DebugHostSnapshot | null;
  readonly installed: boolean;
}

const INITIAL: DebugStoreState = {
  logs: [],
  bootEvents: [],
  hostSnapshot: null,
  installed: false,
};

let logs: DebugLogRecord[] = [];
let bootEvents: DebugBootEvent[] = [];
let hostSnapshot: DebugHostSnapshot | null = null;
let installed = false;
let nextEventId = 0;
const subscribers = new Set<() => void>();

/**
 * Cached snapshot object. **Critical for `useSyncExternalStore`:** the
 * hook treats a new object identity (`Object.is`) as "the store
 * changed", and will re-render on every render where the snapshot
 * differs. If `getSnapshot()` returned a fresh object literal on each
 * call, the panel would infinite-loop because each render calls
 * `getSnapshot` and sees a "new" snapshot.
 *
 * The cache is invalidated only inside `notify()` — that's the single
 * place the store actually mutates. Reads via `getSnapshot()` between
 * mutations return the same reference.
 */
let cachedSnapshot: DebugStoreState = {
  logs,
  bootEvents,
  hostSnapshot,
  installed,
};

function notify(): void {
  // Refresh the cached object *before* notifying subscribers so the
  // snapshot they observe is consistent with the state they just got
  // notified about.
  cachedSnapshot = {
    logs: logs.slice(),
    bootEvents: bootEvents.slice(),
    hostSnapshot,
    installed,
  };
  for (const cb of subscribers) cb();
}

export function appendLog(entry: DebugLogRecord, capacity: number): void {
  logs.push(entry);
  if (logs.length > capacity) {
    logs = logs.slice(logs.length - capacity);
  }
  notify();
}

export function recordBootEvent(
  phase: WalletPhase,
  outcome: DebugBootEvent["outcome"],
  message?: string,
): void {
  bootEvents.push({
    id: nextEventId,
    timestamp: Date.now(),
    phase,
    outcome,
    message,
  });
  nextEventId += 1;
  notify();
}

export function setHostSnapshot(snapshot: DebugHostSnapshot | null): void {
  hostSnapshot = snapshot;
  notify();
}

export function setInstalled(value: boolean): void {
  installed = value;
  notify();
}

export function clearLogs(): void {
  logs = [];
  notify();
}

export function clearBootEvents(): void {
  bootEvents = [];
  notify();
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function getSnapshot(): DebugStoreState {
  return cachedSnapshot;
}

export const debugStore = {
  appendLog,
  recordBootEvent,
  setHostSnapshot,
  setInstalled,
  clearLogs,
  clearBootEvents,
  subscribe,
  getSnapshot,
};

export const __INITIAL_DEBUG_STATE = INITIAL;
