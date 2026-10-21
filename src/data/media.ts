import { mediaFiles, publicMediaPath } from "./media-files.mjs";

/** Stable, ASCII-only public URLs generated before development and Vercel builds. */
export const media = Object.fromEntries(
  Object.entries(mediaFiles).map(([key, filename]) => [key, publicMediaPath(key, filename)]),
) as Record<keyof typeof mediaFiles, string>;
