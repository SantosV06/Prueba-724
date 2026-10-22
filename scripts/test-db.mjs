import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
/** Each integration test process owns a disposable schema. Refuse remote hosts. */
export function testDatabase() {
  if (!process.env.TEST_DATABASE_URL) return new PGlite();
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname))
    throw new Error(
      "TEST_DATABASE_URL must point to local disposable PostgreSQL, never Neon or production.",
    );
  const schema = `qa_${randomBytes(12).toString("hex")}`;
  const pool = new pg.Pool({
    connectionString: url.href,
    max: 4,
    options: `-c search_path=${schema}`,
  });
  const waitReady = (async () => {
    await pool.query(`CREATE SCHEMA ${schema}`);
  })();
  return {
    waitReady,
    async query(text, params = []) {
      await waitReady;
      return pool.query(text, params);
    },
    async exec(text) {
      await waitReady;
      return pool.query(text);
    },
    async close() {
      try {
        await waitReady;
        await pool.query(`DROP SCHEMA ${schema} CASCADE`);
      } finally {
        await pool.end();
      }
    },
  };
}
