// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

import {
  debugStore,
  setInstalled,
  type DebugLogLevel,
  type DebugLogRecord,
} from "./debug-store.ts";

const ORIGINAL_METHODS = new Map<DebugLogLevel, (...args: unknown[]) => void>();
type WindowOnError = Window["onerror"];
type WindowOnUnhandledRejection = Window["onunhandledrejection"];
let originalOnError: WindowOnError = null;
let originalOnUnhandledRejection: WindowOnUnhandledRejection = null;
let installed = false;

const RING_BUFFER_CAPACITY = 2000;

const FORMATTABLE_LEVELS: ReadonlyArray<DebugLogLevel> = ["log", "info", "warn", "error", "debug"];

function formatArgs(args: unknown[]): string {
  const out: string[] = [];
  for (const arg of args) {
    if (typeof arg === "string") {
      out.push(arg);
    } else if (typeof arg === "number" || typeof arg === "boolean" || typeof arg === "bigint") {
      out.push(String(arg));
    } else if (arg === null) {
      out.push("null");
    } else if (arg === undefined) {
      out.push("undefined");
    } else if (arg instanceof Error) {
      const stack = arg.stack ? `\n${arg.stack}` : "";
      out.push(`${arg.name}: ${arg.message}${stack}`);
    } else {
      try {
        out.push(JSON.stringify(arg, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
      } catch {
        out.push(String(arg));
      }
    }
  }
  return out.join(" ");
}

function record(level: DebugLogLevel, message: string, source: DebugLogRecord["source"]): void {
  const entry: DebugLogRecord = {
    id: nextId(),
    timestamp: Date.now(),
    level,
    source,
    message,
  };
  debugStore.appendLog(entry, RING_BUFFER_CAPACITY);
}

let counter = 0;
function nextId(): number {
  counter += 1;
  return counter;
}

export function installConsoleCapture(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const consoleRecord = console as unknown as Record<
    DebugLogLevel,
    (...args: unknown[]) => void
  >;

  for (const level of FORMATTABLE_LEVELS) {
    const original = (consoleRecord[level] ?? (() => undefined)) as (
      ...args: unknown[]
    ) => void;
    ORIGINAL_METHODS.set(level, original);
    consoleRecord[level] = (...args: unknown[]) => {
      record(level, formatArgs(args), "console");
      original.apply(console, args);
    };
  }

  setInstalled(true);

  originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const text = typeof message === "string" ? message : String(message);
    record(
      "error",
      `window.onerror: ${text} (${source}:${lineno}:${colno})${error ? "\n" + (error.stack ?? error.message ?? "") : ""}`,
      "window",
    );
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = event?.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    record("error", `unhandledrejection: ${message}${reason instanceof Error && reason.stack ? "\n" + reason.stack : ""}`, "window");
    if (typeof originalOnUnhandledRejection === "function") {
      return originalOnUnhandledRejection.call(window, event);
    }
    return undefined;
  };
}

export function __uninstallConsoleCaptureForTests(): void {
  if (!installed) return;
  installed = false;
  const consoleRecord = console as unknown as Record<
    DebugLogLevel,
    (...args: unknown[]) => void
  >;
  for (const level of FORMATTABLE_LEVELS) {
    const original = ORIGINAL_METHODS.get(level);
    if (original) consoleRecord[level] = original;
  }
  ORIGINAL_METHODS.clear();
  if (window.onerror && originalOnError) {
    window.onerror = originalOnError;
  }
  if (originalOnUnhandledRejection !== null) {
    window.onunhandledrejection = originalOnUnhandledRejection;
  }
  originalOnError = null;
  originalOnUnhandledRejection = null;
}
