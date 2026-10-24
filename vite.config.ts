import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { siteOrigin } from "./scripts/site-origin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/** Initialize the disposable PGLite schema before dev-server traffic. */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "vne:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") await mod.ensureDbReady();
      } catch (err) {
        console.error("[vne] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

// Keep the documented local dev/preview ports stable for the E2E workflow.
export default defineConfig(({ command, isPreview }) => ({
  publicDir: ".generated-public",
  define: { __SITE_ORIGIN__: JSON.stringify(siteOrigin(process.env)) },
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  resolve: { tsconfigPaths: true },
  optimizeDeps: { include: ["@radix-ui/react-dropdown-menu"] },
  plugins: [
    pgliteBootstrapPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            traceDeps: ["@electric-sql/pglite*"],
            publicAssets: [{ dir: ".generated-public" }, { dir: "public", ignore: ["**"] }],
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));
