import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { recoverOwner } from "./admin-recovery.mjs";
import { verifyPassword } from "../src/lib/password.server.ts";

test("operator recovery only resets an active owner, revokes sessions and audits atomically", async () => {
  const db = new PGlite();
  try {
    for (const file of [
      "0001_volunteer_requests.sql",
      "0002_admin_workflow.sql",
      "0003_admin_accounts.sql",
    ])
      await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
    await db.exec(
      "INSERT INTO admin_users(id,username,display_name,password_hash,role) VALUES ('owner-id','admin','Owner','old','owner'),('member-id','team','Team','old','admin'); INSERT INTO admin_sessions(token_hash,credential_version,expires_at,user_id) VALUES ('old-token','old',NOW()+INTERVAL '1 day','owner-id')",
    );
    await recoverOwner(db, "admin", "replacement-only-for-test");
    assert.equal(
      await verifyPassword(
        "replacement-only-for-test",
        (await db.query("SELECT password_hash FROM admin_users WHERE id='owner-id'")).rows[0]
          .password_hash,
      ),
      true,
    );
    assert.equal((await db.query("SELECT * FROM admin_sessions")).rows.length, 0);
    assert.equal(
      (await db.query("SELECT * FROM admin_events WHERE action='account:recovery'")).rows.length,
      1,
    );
    await assert.rejects(recoverOwner(db, "team", "replacement-only-for-test"), /propietario/);
    await assert.rejects(recoverOwner(db, "admin", "short"), /14 a 256/);
    await db.exec("UPDATE admin_users SET enabled=false WHERE id='owner-id'");
    await assert.rejects(recoverOwner(db, "admin", "replacement-only-for-test"), /propietario/);
    assert.equal((await db.query("SELECT * FROM admin_events")).rows.length, 1);
  } finally {
    await db.close();
  }
});
