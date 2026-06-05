import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const wsProvider = { kind: "ws-provider" } as unknown;
  const hostProvider = { kind: "host-provider" } as unknown;
  return {
    wsProvider,
    hostProvider,
    getWsProvider: vi.fn(() => wsProvider),
    createPapiProvider: vi.fn(() => hostProvider),
    createClient: vi.fn((provider: unknown) => ({ provider, destroy: vi.fn() })),
  };
});

vi.mock("@novasamatech/host-api-wrapper", () => ({
  createPapiProvider: mocks.createPapiProvider,
}));
vi.mock("@polkadot-api/ws-provider", () => ({
  getWsProvider: mocks.getWsProvider,
}));
vi.mock("polkadot-api", () => ({
  createClient: mocks.createClient,
}));

import { getOrCreateClient, resetClientCache } from "@shared/chain/host/client.ts";

const GENESIS =
  "0xbf0488dbe9daa1de1c08c5f743e26fdc2a4ecd74cf87dd1b4b1eeb99ae4ef19f" as const;
const WS = "wss://example.test";

afterEach(() => {
  resetClientCache();
  vi.clearAllMocks();
});

describe("getOrCreateClient transport selection", () => {
  it("auto + in host: routes through createPapiProvider with the WS provider as fallback", () => {
    getOrCreateClient(GENESIS, WS, () => true, "auto");

    expect(mocks.getWsProvider).toHaveBeenCalledWith(WS);
    expect(mocks.createPapiProvider).toHaveBeenCalledWith(GENESIS, mocks.wsProvider);
    expect(mocks.createClient).toHaveBeenCalledWith(mocks.hostProvider);
  });

  it("standalone (!inHost): uses the WS provider directly, never createPapiProvider", () => {
    getOrCreateClient(GENESIS, WS, () => false, "auto");

    expect(mocks.createPapiProvider).not.toHaveBeenCalled();
    expect(mocks.createClient).toHaveBeenCalledWith(mocks.wsProvider);
  });

  it('forced "ws": uses the WS provider directly even in host', () => {
    getOrCreateClient(GENESIS, WS, () => true, "ws");

    expect(mocks.createPapiProvider).not.toHaveBeenCalled();
    expect(mocks.createClient).toHaveBeenCalledWith(mocks.wsProvider);
  });

  it("caches one client per genesis hash", () => {
    const a = getOrCreateClient(GENESIS, WS, () => true, "auto");
    const b = getOrCreateClient(GENESIS, WS, () => true, "auto");

    expect(a).toBe(b);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
  });
});
