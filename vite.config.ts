import { sentryVitePlugin } from "@sentry/vite-plugin";
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const srcPath = (path: string) => new URL(path, import.meta.url).pathname;


const NODE_BUILTINS = [
  /^node:/,
  "fs",
  "path",
  "os",
  "util",
  "module",
  "child_process",
  "fs/promises",
];

export default defineConfig(({ mode }) => ({
  base: "./",

  define: {
    global: "globalThis",
  },
  plugins: [
    react(),
    sentryVitePlugin({
      org: "paritytech",
      project: "w3spay",
      telemetry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": srcPath("./src"),
      "@app": srcPath("./src/app"),
      "@features": srcPath("./src/features"),
      "@shared": srcPath("./src/shared"),
      gifenc: srcPath("./node_modules/gifenc/dist/gifenc.esm.js"),
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  esbuild: {
    target: "es2022",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    server: {
      deps: { inline: ["@bcts/multipart-ur"] },
    },
  },
}));
