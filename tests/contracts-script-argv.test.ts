import { afterEach, describe, expect, it } from "vitest";

import { parseEnvSelector } from "../contracts/scripts/lib/argv.ts";

const NETWORKS = ["paseo-next-v2", "previewnet"] as const;
const ORIGINAL_NPM_CONFIG_ENV = process.env.npm_config_env;

afterEach(() => {
  if (ORIGINAL_NPM_CONFIG_ENV == null) {
    delete process.env.npm_config_env;
  } else {
    process.env.npm_config_env = ORIGINAL_NPM_CONFIG_ENV;
  }
});

describe("parseEnvSelector", () => {
  it("reads direct --env values", () => {
    expect(parseEnvSelector(["node", "script", "--env", "previewnet"], NETWORKS)).toBe(
      "previewnet",
    );
  });

  it("reads direct --env=value values", () => {
    expect(parseEnvSelector(["node", "script", "--env=previewnet"], NETWORKS)).toBe(
      "previewnet",
    );
  });

  it("reads npm --env=value config forwarding", () => {
    process.env.npm_config_env = "previewnet";

    expect(parseEnvSelector(["node", "script"], NETWORKS)).toBe("previewnet");
  });

  it("treats npm run script --env previewnet as a positional network", () => {
    process.env.npm_config_env = "true";

    expect(parseEnvSelector(["node", "script", "previewnet"], NETWORKS)).toBe(
      "previewnet",
    );
  });

  it("skips other flag values before reading a positional network", () => {
    process.env.npm_config_env = "true";

    expect(
      parseEnvSelector(
        [
          "node",
          "script",
          "--admin",
          "0xe2e1c097903f88951fce5ed2ebf226255aa41c01",
          "previewnet",
        ],
        NETWORKS,
      ),
    ).toBe("previewnet");
  });

  it("rejects --env without a value", () => {
    expect(() => parseEnvSelector(["node", "script", "--env"], NETWORKS)).toThrow(
      "--env requires a value",
    );
  });
});
