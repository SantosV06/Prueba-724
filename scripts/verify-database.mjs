/** Read-only checks after provisioning or restoring a Neon branch. Never writes or prints credentials. */
import pg from "pg";
import { readdir } from "node:fs/promises";
import { decryptTotp, totpConfigured } from "../src/lib/admin-totp-crypto.server.ts";
async function main() {
  const url = new URL(process.env.DATABASE_URL);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode"))
  )
    throw new Error("Neon SSL required");
  const pool = new pg.Pool({
    connectionString: url.href,
    max: 1,
    connectionTimeoutMillis: 15000,
    query_timeout: 20000,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const expected = (await readdir(new URL("../migrations/", import.meta.url))).filter((x) =>
      x.endsWith(".sql"),
    );
    const applied = new Set(
      (await client.query("SELECT name FROM _migrations")).rows.map((x) => x.name),
    );
    const missing = expected.filter((name) => !applied.has(name));
    const {
      rows: [counts],
    } = await client.query(
      "SELECT (SELECT count(*)::integer FROM volunteer_requests) AS applications, (SELECT count(*)::integer FROM admin_users) AS accounts, (SELECT count(*)::integer FROM admin_users WHERE totp_secret IS NOT NULL) AS protected",
    );
    // Verify every enrolled key without exposing secrets or TOTP values.
    let keyReadable = counts.protected === 0;
    if (counts.protected && totpConfigured()) {
      const { rows } = await client.query(
        "SELECT id,totp_secret FROM admin_users WHERE totp_secret IS NOT NULL",
      );
      for (const row of rows) decryptTotp(row.totp_secret, row.id);
      keyReadable = true;
    }
    await client.query("COMMIT");
    const ok = missing.length === 0 && keyReadable;
    console.log(
      JSON.stringify({ ok, missingMigrations: missing, counts, totpKeyReadable: keyReadable }),
    );
    if (!ok) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "No se pudo verificar la base. Comprueba conexión privada, migraciones y clave de cifrado; no compartas secretos ni salidas del controlador.",
  );
  process.exitCode = 1;
});
