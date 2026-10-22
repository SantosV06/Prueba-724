import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { retainTrash } from "./retention.mjs";
test("retention dry-run preserves all rows; apply only purges old trash and rolls back if audit fails", async () => {
  const db = new PGlite();
  try {
    for (const file of (await readdir(new URL("../migrations/", import.meta.url)))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
    await db.exec(
      "INSERT INTO volunteer_requests(id,nombre,apellido,correo,telefono,deleted_at) VALUES ('old','A','B','a@example.com','+50760000000',NOW()-INTERVAL '100 days'),('recent','A','B','a@example.com','+50760000000',NOW()-INTERVAL '1 day'),('active','A','B','a@example.com','+50760000000',NULL)",
    );
    assert.equal((await retainTrash(db, 90)).eligible, 1);
    assert.equal((await db.query("SELECT * FROM volunteer_requests")).rows.length, 3);
    await assert.rejects(retainTrash(db, 0));
    await db.exec(
      "ALTER TABLE admin_events ADD CONSTRAINT reject_retention CHECK(action <> 'retention:purge')",
    );
    await assert.rejects(retainTrash(db, 90, true));
    assert.equal((await db.query("SELECT * FROM volunteer_requests")).rows.length, 3);
    await db.exec("ALTER TABLE admin_events DROP CONSTRAINT reject_retention");
    assert.equal((await retainTrash(db, 90, true)).removed, 1);
    assert.deepEqual(
      (await db.query("SELECT id FROM volunteer_requests ORDER BY id")).rows.map((x) => x.id),
      ["active", "recent"],
    );
  } finally {
    await db.close();
  }
});
