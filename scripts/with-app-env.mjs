#!/usr/bin/env node
/**
 * Small cross-platform command runner used by npm scripts.
 * Environment variables are supplied by the shell/Vercel; no generator config
 * file is read and no application secrets are loaded from the repository.
 */
import { spawn } from "node:child_process";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/with-app-env.mjs <command> [args…]");
  process.exit(2);
}
const child = spawn(command, args, { stdio: "inherit", env: process.env });
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(`[command-runner] failed to run ${command}:`, error.message);
  process.exit(127);
});
child.on("exit", (code, signal) => {
  if (signal) {
    const signalNumber = signal === "SIGINT" ? 2 : signal === "SIGTERM" ? 15 : 1;
    process.exit(128 + signalNumber);
  }
  process.exit(code ?? 1);
});
