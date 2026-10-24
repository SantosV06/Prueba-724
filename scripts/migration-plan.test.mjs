import assert from "node:assert/strict";
import { test } from "node:test";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";

test("migration keys use the basename, not the full path", () => {
  assert.equal(migrationName("/migrations/0002_todos.sql"), "0002_todos.sql");
  assert.equal(migrationName("migrations/0001_initial.sql"), "0001_initial.sql");
  assert.equal(migrationName("0001_initial.sql"), "0001_initial.sql");
});

test("a migration already applied is not applied again", () => {
  assert.deepEqual(pendingMigrations(["/migrations/0001_initial.sql"], ["0001_initial.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-SQL entries are ignored", () => {
  assert.equal(isMigrationFile("README.md"), false);
  assert.equal(isMigrationFile("auth"), false);
  assert.deepEqual(pendingMigrations(["README.md", "auth", "0001_initial.sql"], []), [
    { name: "0001_initial.sql", path: "0001_initial.sql" },
  ]);
});
