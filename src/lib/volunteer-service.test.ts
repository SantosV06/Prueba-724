import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { testDatabase } from "../../scripts/test-db.mjs";

// Full real PostgreSQL schema/queries in a disposable local DB; no production credentials.
const pg = testDatabase();
const cookies = new Map<string, string>();
let address = "192.0.2.1";
let site = "same-origin";
let failRevocation = false;
let failExportAudit = false;
mock.module("@tanstack/react-start/server", {
  namedExports: {
    getCookie: (name: string) => cookies.get(name),
    setCookie: (name: string, value: string) => {
      cookies.set(name, value);
    },
    deleteCookie: (name: string) => {
      cookies.delete(name);
    },
    setResponseHeader: () => undefined,
    getRequest: () =>
      new Request("https://example.test/", {
        headers: { "sec-fetch-site": site, "x-forwarded-for": address },
      }),
  },
});
mock.module("./db.ts", {
  namedExports: {
    dbSource: "neon",
    getSql: async () => ({
      query: async (sql: string, params: unknown[] = []) => {
        if (failRevocation && sql.startsWith("DELETE FROM admin_sessions WHERE token_hash"))
          throw new Error("database unavailable");
        if (failExportAudit && sql.startsWith("INSERT INTO admin_events"))
          throw new Error("audit unavailable");
        return (await pg.query(sql, params)).rows;
      },
    }),
  },
});
const service = await import("./volunteer-service.server.ts");

test("volunteer and admin workflow: durable data, limits, revocation, pagination, export and recovery", async (t) => {
  t.after(() => pg.close());
  await pg.waitReady;
  for (const file of [
    "0001_volunteer_requests.sql",
    "0002_admin_workflow.sql",
    "0003_admin_accounts.sql",
    "0004_export_revision.sql",
    "0005_admin_totp.sql",
    "0006_admin_session_guard.sql",
    "0007_operations.sql",
  ])
    await pg.exec(await readFile(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  process.env.ADMIN_SESSION_SECRET = "test-secret-never-for-production-32-characters";
  delete process.env.ADMIN_PASSWORD;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  const input = {
    nombre: "Ana",
    apellido: "Pérez",
    correo: "ana@example.com",
    telefono: "+507 6000 0000",
    mensaje: "Ayudar",
    requestKey: randomUUID(),
  };
  await service.saveVolunteerRequest(input);
  await service.saveVolunteerRequest(input);
  assert.equal(
    (await pg.query("SELECT * FROM volunteer_requests")).rows.length,
    1,
    "retry must not duplicate a request",
  );
  for (let i = 0; i < 4; i++)
    await service.saveVolunteerRequest({ ...input, requestKey: randomUUID() });
  await assert.rejects(
    service.saveVolunteerRequest({ ...input, requestKey: randomUUID() }),
    /Demasiados/,
  );
  await pg.exec(
    "INSERT INTO request_limits(scope,key_hash,started_at) VALUES ('login','old',NOW()-INTERVAL '2 days')",
  );
  address = "192.0.2.2";
  process.env.ADMIN_PASSWORD = "test-only-password-12345";
  await assert.rejects(service.loginAdministrator("wrong"), /incorrecta/);
  const failures = (await pg.query("SELECT * FROM admin_events WHERE action='login:failure'")).rows;
  assert.equal(failures.length, 1, "a rejected bootstrap login is audited");
  for (const field of ["actor_id", "actor_username", "request_id", "before_value", "after_value"])
    assert.equal(failures[0][field], null, "rejection audit does not retain submitted data");
  await service.loginAdministrator(process.env.ADMIN_PASSWORD);
  await assert.rejects(service.loginAdministrator("wrong", "nonexistent-user"), /incorrecta/);
  failExportAudit = true;
  const auditErrors: unknown[] = [];
  const errorLog = mock.method(console, "error", (...args: unknown[]) => auditErrors.push(args));
  try {
    await assert.rejects(service.loginAdministrator("wrong", "nonexistent-user"), /incorrecta/);
  } finally {
    failExportAudit = false;
    errorLog.mock.restore();
  }
  assert.deepEqual(auditErrors, [[JSON.stringify({ event: "audit:login-failure-unavailable" })]]);
  assert.equal(
    (await pg.query("SELECT * FROM request_limits WHERE key_hash='old'")).rows.length,
    0,
  );
  assert.equal(await service.isAdminAuthenticated(), true);
  const token = cookies.get("vne-admin-session")!;
  assert.ok(!JSON.stringify((await pg.query("SELECT * FROM admin_sessions")).rows).includes(token));
  const filters = { page: 1, search: "", status: "" as const, trash: false };
  const initial = await service.listVolunteerRequests(filters);
  const id = initial.rows[0].id;
  await service.changeVolunteerRequest(id, "status", "contactada");
  assert.equal(
    (await service.listVolunteerRequests({ ...filters, status: "contactada" })).total,
    1,
  );
  await service.changeVolunteerRequest(id, "trash");
  assert.equal((await service.listVolunteerRequests({ ...filters, trash: true })).total, 1);
  await service.changeVolunteerRequest(id, "restore");
  assert.equal((await service.listVolunteerRequests({ ...filters, trash: true })).total, 0);
  assert.equal(
    (await pg.query("SELECT * FROM admin_events WHERE request_id=$1", [id])).rows.length,
    3,
  );
  await pg.exec(
    "INSERT INTO volunteer_requests(id,nombre,apellido,correo,telefono) SELECT md5(n::text)::uuid::text, 'Prueba', 'Equipo', 'test@example.com', '+507 6000 0000' FROM generate_series(1,1001) n",
  );
  const page = await service.listVolunteerRequests({ ...filters, page: 2 });
  assert.equal(page.rows.length, 50);
  assert.equal(page.total, 1006);
  assert.equal(
    (await service.listVolunteerRequests({ ...filters, search: "%" })).total,
    0,
    "search treats LIKE operators literally",
  );
  let cursor;
  let snapshot;
  let revision;
  let exportId: string | undefined;
  const exported = new Set<string>();
  do {
    const result = await service.exportVolunteerRequests(
      filters,
      cursor,
      snapshot,
      revision,
      exportId,
    );
    if (exportId) assert.equal(result.exportId, exportId);
    exportId = result.exportId;
    for (const row of result.rows) {
      assert.ok(!exported.has(row.id));
      exported.add(row.id);
    }
    cursor = result.next ?? undefined;
    snapshot = result.snapshot;
    revision = result.revision;
  } while (cursor);
  assert.equal(exported.size, 1006, "export traverses beyond the old 1000-row limit");
  const exportEvents = (
    await pg.query<{
      actor_username: string;
      actor_id: string;
      after_value: { exportId: string; rowCount: number; lastBatch: boolean };
    }>("SELECT * FROM admin_events WHERE action='export:batch'")
  ).rows;
  assert.equal(exportEvents.length, 3, "every delivered batch is audited");
  assert.equal(
    exportEvents.reduce((sum, event) => sum + event.after_value.rowCount, 0),
    1006,
  );
  assert.ok(exportEvents.every((event) => event.actor_username === "admin" && event.actor_id));
  assert.ok(exportEvents.every((event) => event.after_value.exportId === exportId));
  assert.equal(exportEvents.filter((event) => event.after_value.lastBatch).length, 1);
  const filtered = await service.exportVolunteerRequests({ ...filters, search: input.correo });
  const [filteredAudit] = (
    await pg.query<{ after_value: { rowCount: number; searchApplied: boolean } }>(
      "SELECT after_value FROM admin_events WHERE after_value->>'exportId'=$1",
      [filtered.exportId],
    )
  ).rows;
  assert.equal(filteredAudit.after_value.rowCount, 5);
  assert.equal(filteredAudit.after_value.searchApplied, true);
  assert.ok(!JSON.stringify(filteredAudit).includes(input.correo), "search text is not retained");
  assert.ok(
    !JSON.stringify(filteredAudit).includes(input.telefono),
    "volunteer data is not copied",
  );
  failExportAudit = true;
  await assert.rejects(service.exportVolunteerRequests(filters), /audit unavailable/);
  failExportAudit = false;
  const batch = await service.exportVolunteerRequests(filters);
  await service.changeVolunteerRequest(id, "status", "pendiente");
  await assert.rejects(
    service.exportVolunteerRequests(
      filters,
      batch.next ?? undefined,
      batch.snapshot,
      batch.revision,
    ),
    /cambiaron/,
  );
  await service.changeVolunteerRequest(id, "status", "contactada");
  site = "cross-site";
  await assert.rejects(service.exportVolunteerRequests(filters), /cross-site/);
  await assert.rejects(service.changeVolunteerRequest(id, "trash"), /cross-site/);
  site = "same-origin";
  failRevocation = true;
  await assert.rejects(service.logoutAdministrator(), /database unavailable/);
  assert.equal(
    cookies.get("vne-admin-session"),
    token,
    "failed logout must not pretend to revoke the session",
  );
  failRevocation = false;
  await service.logoutAdministrator();
  cookies.set("vne-admin-session", token);
  assert.equal(
    await service.isAdminAuthenticated(),
    false,
    "copied cookie must be rejected after logout",
  );
  await assert.rejects(service.listVolunteerRequests(filters), /no autorizado/);
  await assert.rejects(service.exportVolunteerRequests(filters), /no autorizado/);
  cookies.clear();
  await service.loginAdministrator(process.env.ADMIN_PASSWORD);
  const [owner] = await service.listAdminAccounts();
  assert.equal(owner.username, "admin");
  assert.equal(owner.role, "owner");
  await service.createAdminAccount({
    username: "equipo",
    displayName: "Equipo VNE",
    password: "individual-password-1234",
  });
  await assert.rejects(
    service.createAdminAccount({
      username: "equipo",
      displayName: "Otro",
      password: "individual-password-5678",
    }),
    /ya existe/,
  );
  const member = (await service.listAdminAccounts()).find((user) => user.username === "equipo")!;
  const ownerToken = cookies.get("vne-admin-session")!;
  cookies.clear();
  await service.loginAdministrator("individual-password-1234", "equipo");
  const memberToken = cookies.get("vne-admin-session")!;
  assert.equal((await service.currentAdministrator())?.username, "equipo");
  const teamExport = await service.exportVolunteerRequests({ ...filters, search: "no-matches" });
  assert.equal(teamExport.rows.length, 0);
  const [teamAudit] = (
    await pg.query<{ actor_id: string; actor_username: string; after_value: { rowCount: number } }>(
      "SELECT * FROM admin_events WHERE after_value->>'exportId'=$1",
      [teamExport.exportId],
    )
  ).rows;
  assert.equal(teamAudit.actor_id, member.id);
  assert.equal(teamAudit.actor_username, "equipo");
  assert.equal(teamAudit.after_value.rowCount, 0);
  await assert.rejects(service.listAdminAccounts(), /propietario/);
  await assert.rejects(
    service.createAdminAccount({
      username: "intruso",
      displayName: "No",
      password: "another-password-1234",
    }),
    /propietario/,
  );
  await assert.rejects(
    service.updateAdminAccount({ id: owner.id, password: "unauthorized-password" }),
    /propietario/,
  );
  await service.changeVolunteerRequest(id, "status", "aceptada");
  const [audit] = (
    await pg.query<{
      actor_username: string;
      before_value: { status: string };
      after_value: { status: string };
    }>("SELECT * FROM admin_events WHERE request_id=$1 AND action='status:aceptada'", [id])
  ).rows;
  assert.equal(audit.actor_username, "equipo");
  assert.equal(audit.before_value.status, "contactada");
  assert.equal(audit.after_value.status, "aceptada");
  await assert.rejects(service.changeVolunteerRequest(id, "purge"), /propietario/);
  cookies.set("vne-admin-session", ownerToken);
  await service.updateAdminAccount({ id: member.id, enabled: false });
  cookies.set("vne-admin-session", memberToken);
  assert.equal(await service.isAdminAuthenticated(), false);
  address = "192.0.2.3";
  await assert.rejects(
    service.loginAdministrator("individual-password-1234", "equipo"),
    /incorrecta/,
  );
  cookies.set("vne-admin-session", ownerToken);
  await assert.rejects(
    service.updateAdminAccount({ id: owner.id, enabled: false }),
    /propia cuenta/,
  );
  await service.updateAdminAccount({ id: member.id, enabled: true });
  await service.updateAdminAccount({ id: member.id, password: "replacement-password-1234" });
  cookies.clear();
  await assert.rejects(
    service.loginAdministrator("individual-password-1234", "equipo"),
    /incorrecta/,
  );
  await service.loginAdministrator("replacement-password-1234", "equipo");
  assert.equal(await service.isAdminAuthenticated(), true);
  const replacementToken = cookies.get("vne-admin-session")!;
  // Exhausting an account/IP budget must not lock the owner out on another connection.
  address = "192.0.2.80";
  const failureCount = async () =>
    Number(
      (await pg.query("SELECT count(*) AS total FROM admin_events WHERE action='login:failure'"))
        .rows[0].total,
    );
  const beforeFailures = await failureCount();
  for (let i = 0; i < 8; i++)
    await assert.rejects(service.loginAdministrator("wrong", "admin"), /incorrecta/);
  await assert.rejects(
    service.loginAdministrator(process.env.ADMIN_PASSWORD, "admin"),
    /Demasiados/,
  );
  assert.equal(
    await failureCount(),
    beforeFailures + 8,
    "rate-limited traffic cannot amplify audit writes",
  );
  address = "192.0.2.81";
  await service.loginAdministrator(process.env.ADMIN_PASSWORD, "admin");

  cookies.set("vne-admin-session", ownerToken);
  await service.changeVolunteerRequest(id, "purge");
  assert.equal(
    (await pg.query("SELECT id FROM volunteer_requests WHERE id=$1", [id])).rows.length,
    1,
    "purge only permits trash",
  );
  await service.changeVolunteerRequest(id, "trash");
  await service.changeVolunteerRequest(id, "purge");
  assert.equal(
    (await pg.query("SELECT id FROM volunteer_requests WHERE id=$1", [id])).rows.length,
    0,
  );
  const hashed = JSON.stringify((await pg.query("SELECT password_hash FROM admin_users")).rows);
  assert.ok(!hashed.includes("replacement-password-1234"));
  // The old environment password can no longer bypass account credentials.
  await service.updateAdminAccount({ id: owner.id, password: "new-owner-password-12345" });
  assert.equal(await service.isAdminAuthenticated(), false);
  address = "192.0.2.4";
  await assert.rejects(service.loginAdministrator(process.env.ADMIN_PASSWORD), /incorrecta/);
  await service.loginAdministrator("new-owner-password-12345");
  cookies.set("vne-admin-session", replacementToken);
  process.env.ADMIN_SESSION_SECRET += "-rotated";
  assert.equal(
    await service.isAdminAuthenticated(),
    false,
    "secret rotation invalidates every account session",
  );
  cookies.clear();
  process.env.VERCEL_ENV = "preview";
  delete process.env.PREVIEW_DATABASE_ISOLATED;
  await assert.rejects(
    service.saveVolunteerRequest({ ...input, requestKey: randomUUID() }),
    /vista previa/,
  );
});
