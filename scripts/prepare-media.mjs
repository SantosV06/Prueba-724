import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { siteOrigin, publicPages } from "./site-origin.mjs";
import { mediaFiles, publicMediaPath } from "../src/data/media-files.mjs";

// Vite serves a generated public directory. Originals remain in Git, but are not
// copied twice into every deployment. This script never mutates source assets.
const publicDir = new URL("../public/", import.meta.url);
const output = new URL("../.generated-public/", import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of readdirSync(publicDir)) {
  if (entry === "media" || entry === "assets") continue;
  cpSync(new URL(entry, publicDir), new URL(entry, output), { recursive: true });
}
const assets = new URL("assets/", publicDir);
if (existsSync(assets))
  for (const entry of readdirSync(assets)) {
    if (entry !== "img")
      cpSync(new URL(entry, assets), new URL(`assets/${entry}`, output), { recursive: true });
  }
mkdirSync(new URL("media/", output), { recursive: true });
for (const [key, filename] of Object.entries(mediaFiles)) {
  const path = publicMediaPath(key, filename);
  const optimized = new URL(`../media-optimized/${path.split("/").pop()}`, import.meta.url);
  const original = new URL(`assets/img/${encodeURIComponent(filename)}`, publicDir);
  const source = existsSync(optimized) ? optimized : original;
  if (!existsSync(source) || (filename.endsWith(".png") && !existsSync(optimized))) {
    throw new Error(
      `[media] Missing optimized asset for ${key}. Run scripts/optimize-media.py before committing.`,
    );
  }
  copyFileSync(source, new URL(`.${path}`, output));
  if (filename.endsWith(".mp4")) {
    const poster = new URL(`../media-optimized/${key}-poster.jpg`, import.meta.url);
    if (!existsSync(poster)) throw new Error(`[media] Missing poster for ${key}`);
    copyFileSync(poster, new URL(`media/${key}-poster.jpg`, output));
  }
}
console.log(
  `[media] Prepared ${Object.keys(mediaFiles).length} assets in ${fileURLToPath(output)}`,
);

const origin = siteOrigin(process.env);
const preview = process.env.VERCEL_ENV === "preview";
writeFileSync(
  new URL("robots.txt", output),
  preview
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /solicitudes\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`,
);
if (origin)
  writeFileSync(
    new URL("sitemap.xml", output),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>`,
  );
