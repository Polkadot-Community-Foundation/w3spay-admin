export type Argv = Record<string, string>;

const ENV_PREFIX = "W3SPAY_";
const ENV_FLAG_USAGE =
  "--env requires a value (e.g. paseo-next-v2 | previewnet)";

function envKeyFor(flag: string): string {
  return ENV_PREFIX + flag.replace(/-/g, "_").toUpperCase();
}

export function parseArgv(raw = process.argv.slice(2)): Argv {
  const out: Argv = {};
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (!token.startsWith("--")) continue;
    const eq = token.indexOf("=");
    if (eq >= 0) {
      out[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }
    const next = raw[i + 1];
    if (next != null && !next.startsWith("--")) {
      out[token.slice(2)] = next;
      i += 1;
    } else {
      out[token.slice(2)] = "true";
    }
  }
  return out;
}

export function readArg(argv: Argv, key: string): string | undefined {
  const fromCli = argv[key];
  if (fromCli != null && fromCli.length > 0) return fromCli;
  const fromEnv = process.env[envKeyFor(key)];
  if (fromEnv != null && fromEnv.length > 0) return fromEnv;
  return undefined;
}

function npmConfigKeyFor(flag: string): string {
  return `npm_config_${flag.replace(/-/g, "_").toLowerCase()}`;
}

function readNpmConfigArg(key: string): string | undefined {
  const value = process.env[npmConfigKeyFor(key)];
  if (value == null || value.length === 0 || value === "true") return undefined;
  return value;
}

export function parseEnvSelector(
  argv: string[],
  supportedNetworks: readonly string[],
): string | undefined {
  const raw = argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (token === "--env") {
      const value = raw[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(ENV_FLAG_USAGE);
      }
      return value;
    }
    if (token.startsWith("--env=")) {
      const value = token.slice("--env=".length);
      if (!value) {
        throw new Error(ENV_FLAG_USAGE);
      }
      return value;
    }
  }

  const npmEnv = readNpmConfigArg("env");
  if (npmEnv != null) return npmEnv;

  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (token === "--") continue;
    if (token.startsWith("--")) {
      if (
        !token.includes("=") &&
        raw[i + 1] != null &&
        !raw[i + 1].startsWith("--")
      ) {
        i += 1;
      }
      continue;
    }
    if (supportedNetworks.includes(token)) return token;
  }

  return undefined;
}

export function requireArg(argv: Argv, key: string, usageHint?: string): string {
  const value = readArg(argv, key);
  if (value == null) {
    const envName = envKeyFor(key);
    throw new Error(
      `missing required --${key}${usageHint ? ` (${usageHint})` : ""}; ` +
        `pass --${key}=… or set ${envName}=…`
    );
  }
  return value;
}
