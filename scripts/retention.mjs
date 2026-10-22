/** Default is read-only. No schedule and no deletion without --apply plus an explicit period. */
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import pg from "pg";
export async function retainTrash(client, days, apply = false) {
  if (!Number.isInteger(days) || days < 30 || days > 3650)
    throw new Error("DATA_RETENTION_DAYS debe ser un entero entre 30 y 3650.");
  if (!apply) {
    const { rows } = await client.query(
      "SELECT count(*)::integer AS eligible FROM volunteer_requests WHERE deleted_at < NOW()-($1::integer * INTERVAL '1 day')",
      [days],
    );
    return { applied: false, eligible: rows[0].eligible, days };
  }
  await client.query("BEGIN");
  try {
    const { rows } = await client.query(
      `WITH removed AS (DELETE FROM volunteer_requests WHERE deleted_at < NOW()-($1::integer * INTERVAL '1 day') RETURNING id),
       audit AS (INSERT INTO admin_events(id,action,actor_username,after_value)
         SELECT $2,'retention:purge','database-operator',jsonb_build_object('days',$1::integer,'count',count(*)) FROM removed RETURNING id)
       SELECT count(*)::integer AS removed FROM removed WHERE EXISTS(SELECT 1 FROM audit)`,
      [days, randomUUID()],
    );
    await client.query("COMMIT");
    return { applied: true, removed: rows[0].removed, days };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
async function main() {
  if (process.argv.slice(2).some((arg) => arg !== "--apply"))
    throw new Error("Uso: npm run data:retention -- [--apply]");
  const url = new URL(process.env.DATABASE_URL);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode"))
  )
    throw new Error("Usa una conexión privada de Neon con SSL.");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 15000,
    query_timeout: 60000,
  });
  let client;
  try {
    client = await pool.connect();
    console.log(
      JSON.stringify(
        await retainTrash(
          client,
          Number(process.env.DATA_RETENTION_DAYS),
          process.argv.includes("--apply"),
        ),
      ),
    );
  } finally {
    client?.release();
    await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error(
      "No se completó la retención. Revisa conexión, migraciones y plazo; no compartas los secretos.",
    );
    process.exitCode = 1;
  });
