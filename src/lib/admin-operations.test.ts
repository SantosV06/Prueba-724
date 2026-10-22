import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { testDatabase } from "../../scripts/test-db.mjs";
import { homeContentSchema } from "./admin-operations.ts";
const db = testDatabase();
const cookies = new Map<string, string>();
mock.module("@tanstack/react-start/server", {
  namedExports: {
    getCookie: (name: string) => cookies.get(name),
    setCookie: (name: string, value: string) => cookies.set(name, value),
    deleteCookie: (name: string) => cookies.delete(name),
    setResponseHeader: () => undefined,
    getRequest: () =>
      new Request("https://example.test/", {
        headers: { "sec-fetch-site": "same-origin", "x-forwarded-for": "192.0.2.155" },
      }),
  },
});
mock.module("./db.ts", {
  namedExports: {
    dbSource: "neon",
    getSql: async () => ({
      query: async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows,
    }),
  },
});
const service = await import("./volunteer-service.server.ts");
const operations = await import("./admin-operations.server.ts");
const mfa = await import("./admin-totp.server.ts");
const { authenticator } = await import("./admin-totp-crypto.server.ts");
test("owner operations: policy enforces enrollment on the server, role restrictions, audit and concurrent editing", async () => {
  try {
    for (const file of (await readdir(new URL("../../migrations/", import.meta.url)))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
    process.env.ADMIN_SESSION_SECRET = "local-test-session-secret-at-least-32-characters";
    process.env.ADMIN_TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    process.env.ADMIN_PASSWORD = "local-test-owner-password-123";
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    await assert.rejects(
      operations.listAuditEvents({ page: 1, actor: "", action: "" }),
      /no autorizado/,
    );
    await assert.rejects(operations.saveSiteLanguage("en", 1), /no autorizado/);
    await service.loginAdministrator(process.env.ADMIN_PASSWORD);
    assert.equal((await operations.readSiteLanguage()).language, "es");
    await operations.saveSiteLanguage("en", 1);
    assert.equal((await operations.readSiteLanguage()).language, "en");
    await assert.rejects(operations.saveSiteLanguage("pt", 1), /configuración cambió/);
    await assert.rejects(operations.saveSiteLanguage("fr", 2));
    await operations.saveSiteLanguage("es", 2);
    assert.equal(
      (await operations.listAuditEvents({ page: 1, actor: "admin", action: "settings:language" }))
        .total,
      2,
    );
    await assert.rejects(
      operations.updateTwoFactorPolicy(true, process.env.ADMIN_PASSWORD),
      /Activa 2FA/,
    );
    const setup = await mfa.beginTwoFactor(process.env.ADMIN_PASSWORD);
    const { codes } = await mfa.confirmTwoFactor(
      process.env.ADMIN_PASSWORD,
      authenticator(setup.secret).generate(),
    );
    await service.loginAdministrator(process.env.ADMIN_PASSWORD, "admin", codes[0]);
    const ownerToken = cookies.get("vne-admin-session")!;
    await operations.updateTwoFactorPolicy(true, process.env.ADMIN_PASSWORD);
    assert.equal((await operations.operationsStatus()).required, true);
    await assert.rejects(mfa.disableTwoFactor(process.env.ADMIN_PASSWORD, codes[1]), /exige 2FA/);
    await service.createAdminAccount({
      username: "member",
      displayName: "Member",
      password: "local-test-member-password-123",
    });
    cookies.clear();
    await service.loginAdministrator("local-test-member-password-123", "member");
    assert.equal((await service.currentAdministrator())?.requiresEnrollment, true);
    await assert.rejects(
      service.listVolunteerRequests({ page: 1, search: "", status: "", trash: false }),
      /Activa 2FA/,
    );
    await assert.rejects(
      service.exportVolunteerRequests({ search: "", status: "", trash: false }),
      /Activa 2FA/,
    );
    await assert.rejects(operations.readHomeContent(), /Activa 2FA/);
    assert.equal((await mfa.twoFactorStatus()).enabled, false);
    const memberSetup = await mfa.beginTwoFactor("local-test-member-password-123");
    assert.ok(memberSetup.qr);
    await service.logoutAdministrator();
    cookies.set("vne-admin-session", ownerToken);
    await operations.updateTwoFactorPolicy(false, process.env.ADMIN_PASSWORD);
    const content = {
      title: { es: "Título", en: "Title", pt: "Título" },
      description: { es: "Descripción", en: "Description", pt: "Descrição" },
    };
    await operations.saveHomeContent(homeContentSchema.parse(content), 0);
    assert.equal((await operations.readHomeContent()).revision, 1);
    await assert.rejects(operations.saveHomeContent(content, 0), /contenido cambió/);
    await operations.saveHomeContent(
      { ...content, title: { ...content.title, es: "Actualizado" } },
      1,
    );
    await assert.rejects(operations.saveHomeContent(content, 1), /contenido cambió/);
    assert.equal((await operations.readHomeContent()).content?.title.es, "Actualizado");
    const audit = await operations.listAuditEvents({
      page: 99999,
      actor: "admin",
      action: "content:home",
    });
    assert.equal(audit.total, 2);
    assert.equal(audit.page, 1);
    assert.ok(
      audit.rows.every(
        (row) => Object.keys(row).sort().join() === "action,actor,date,id,requestId",
      ),
    );
    assert.equal(
      (await operations.listAuditEvents({ page: 1, actor: "admin' OR 1=1 --", action: "" })).total,
      0,
    );
    cookies.clear();
    await service.loginAdministrator("local-test-member-password-123", "member");
    await assert.rejects(
      operations.listAuditEvents({ page: 1, actor: "", action: "" }),
      /propietario/,
    );
    await assert.rejects(operations.saveHomeContent(content, 2), /propietario/);
    await assert.rejects(operations.saveSiteLanguage("pt", 3), /propietario/);
    await assert.rejects(
      operations.changeOwnPassword("incorrect", "local-new-password-123"),
      /incorrecta/,
    );
    const previous = cookies.get("vne-admin-session")!;
    await operations.changeOwnPassword("local-test-member-password-123", "local-new-password-123");
    cookies.set("vne-admin-session", previous);
    assert.equal(await service.currentAdministrator(), null);
    await service.loginAdministrator("local-new-password-123", "member");
    assert.equal((await service.currentAdministrator())?.username, "member");
  } finally {
    await db.close();
  }
});
