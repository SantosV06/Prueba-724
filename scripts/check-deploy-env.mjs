/** Validate server-only production configuration without logging secret values. */
export function validateDeployEnv(env) {
  if (env.VERCEL_ENV !== "production") return;
  if (!env.DATABASE_URL?.trim())
    throw new Error("Production requires DATABASE_URL (Neon pooled connection with SSL).");
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  if (!url.hostname.endsWith(".neon.tech") || !url.hostname.includes("-pooler"))
    throw new Error("Production DATABASE_URL must use the Neon pooled endpoint (-pooler).");
  if (!["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode")))
    throw new Error("DATABASE_URL must require SSL.");
  if ((env.ADMIN_PASSWORD ?? "").length < 14 || (env.ADMIN_PASSWORD ?? "").length > 256)
    throw new Error("ADMIN_PASSWORD must contain 14–256 characters.");
  if ((env.ADMIN_SESSION_SECRET ?? "").length < 32)
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  const encodedKey = env.ADMIN_TOTP_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey)
    throw new Error("ADMIN_TOTP_ENCRYPTION_KEY must contain 32 random bytes encoded as Base64.");
  if (env.SITE_URL) {
    const site = new URL(env.SITE_URL);
    if (
      site.protocol !== "https:" ||
      site.username ||
      site.password ||
      site.pathname !== "/" ||
      site.search ||
      site.hash
    )
      throw new Error("SITE_URL must be an HTTPS origin without a path, query or credentials.");
  }
}
