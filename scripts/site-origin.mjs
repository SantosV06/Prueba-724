export function siteOrigin(env) {
  const raw =
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (!raw) return "";
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("SITE_URL must be an HTTPS origin.");
  return url.origin;
}
export const publicPages = [
  "/",
  "/casas",
  "/genesis",
  "/liderazgo",
  "/soporte",
  "/donaciones",
  "/voluntariado",
  "/legal/privacidad",
  "/legal/terminos",
  "/legal/conflicto",
  "/legal/no-discriminacion",
];
