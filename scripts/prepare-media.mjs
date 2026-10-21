import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mediaFiles, publicMediaPath } from "../src/data/media-files.mjs";

const publicDir = new URL("../public/", import.meta.url);
const output = new URL("media/", publicDir);
// Only generated copies live here; rebuilding removes outdated copies.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const missing = [];
for (const [key, filename] of Object.entries(mediaFiles)) {
  const source = new URL(`assets/img/${encodeURIComponent(filename)}`, publicDir);
  if (!existsSync(source)) {
    missing.push(filename);
    continue;
  }
  const destination = new URL(`.${publicMediaPath(key, filename)}`, publicDir);
  copyFileSync(source, destination);
}
if (missing.length) {
  console.warn("[media] Upload the following files to public/assets/img/:\n" + missing.join("\n"));
} else {
  console.log(`[media] Prepared ${Object.keys(mediaFiles).length} files in ${fileURLToPath(output)}`);
}
