import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Lets README snippets import from "steam-fake" verbatim and still run
    // in-repo; consumers resolve the published package name instead.
    alias: { "steam-fake": resolve(root, "src/index.ts") },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
