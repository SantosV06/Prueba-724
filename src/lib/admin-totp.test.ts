import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { testDatabase } from "../../scripts/test-db.mjs";
import {
  authenticator,
  encryptTotp,
  decryptTotp,
  verifyTotpStep,
} from "./admin-totp-crypto.server.ts";

const pg = testDatabase();
const cookies = new Map<string, string>();
let site = "same-origin";
let isolatedLoginRequests = false;
let lastIssuedCookie = "";
mock.module("@tanstack/react-start/server", {
  exports: {
    getCookie: (name: string) => (isolatedLoginRequests ? undefined : cookies.get(name)),
    setCookie: (name: string, value: string) => {
      cookies.set(name, value);
      lastIssuedCookie = value;
    },
    deleteCookie: (name: string) => {
      cookies.delete(name);
    },
    setResponseHeader: () => undefined,
    getRequest: () =>
      new Request("https://example.test/", {
        headers: { "sec-fetch-site": site, "x-forwarded-for": "192.0.2.90" },
      }),
  },
});
mock.module("./db.ts", {
  exports: {
    dbSource: "neon",
    getSql: async () => ({
      query: async (sql: string, params: unknown[] = []) => (await pg.query(sql, params)).rows,
    }),
  },
});
const service = await import("./volunteer-service.server.ts");
const mfa = await import("./admin-totp.server.ts");
const password = "local-test-password-only-123";

test("TOTP: encryption and RFC 6238 vector", () => {
  process.env.ADMIN_TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const encrypted = encryptTotp(secret, "user-a");
  assert.ok(!encrypted.includes(secret));
  assert.equal(decryptTotp(encrypted, "user-a"), secret);
  assert.throws(() => decryptTotp(encrypted, "user-b"));
  assert.throws(() => decryptTotp(encrypted.slice(0, -5) + "AAAAA", "user-a"));
  assert.equal(verifyTotpStep(secret, "287082", 59000), 1);
  assert.equal(verifyTotpStep(secret, "287082", 180000), null);
  assert.equal(verifyTotpStep(secret, "1", 59000), null);
  assert.equal(authenticator(secret).generate({ timestamp: 59000 }), "287082");
});

test("real DB: enrollment, no bypass, atomic one-use proofs, revocation, limits and recovery", async (t) => {
  t.mock.method(Date, "now", () => 1_700_000_015_000);
  try {
    for (const name of (await readdir(new URL("../../migrations/", import.meta.url)))
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await pg.exec(await readFile(new URL(`../../migrations/${name}`, import.meta.url), "utf8"));
    process.env.ADMIN_SESSION_SECRET = "local-test-session-secret-at-least-32-characters";
    process.env.ADMIN_TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    process.env.ADMIN_PASSWORD = password;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    await assert.rejects(mfa.twoFactorStatus(), /no autorizado/);
    await service.loginAdministrator(password);
    const user = (await service.currentAdministrator())!;
    assert.equal((await mfa.twoFactorStatus()).enabled, false);
    await assert.rejects(mfa.beginTwoFactor("incorrect"), /incorrecta/);
    const setup = await mfa.beginTwoFactor(password);
    assert.match(setup.qr, /^data:image\/png;base64,/);
    const pending = (
      await pg.query<{ encrypted_secret: string }>("SELECT * FROM admin_totp_pending")
    ).rows[0];
    assert.ok(!pending.encrypted_secret.includes(setup.secret));
    assert.equal((await mfa.twoFactorStatus()).enabled, false);
    await pg.exec("UPDATE admin_totp_pending SET expires_at=NOW()-INTERVAL '1 minute'");
    await assert.rejects(mfa.confirmTwoFactor(password, "123456"), /caducó/);
    const active = await mfa.beginTwoFactor(password);
    const otp = authenticator(active.secret);
    const activationCode = otp.generate({ timestamp: Date.now() - 30000 });
    // Force the actual DB audit to fail: all enrollment writes must roll back.
    await pg.exec(
      "ALTER TABLE admin_events ADD CONSTRAINT test_audit_failure CHECK(action <> '2fa:enabled')",
    );
    await assert.rejects(mfa.confirmTwoFactor(password, activationCode));
    assert.equal((await mfa.twoFactorStatus()).enabled, false);
    assert.equal((await pg.query("SELECT * FROM admin_recovery_codes")).rows.length, 0);
    await pg.exec("ALTER TABLE admin_events DROP CONSTRAINT test_audit_failure");
    const { codes } = await mfa.confirmTwoFactor(password, activationCode);
    assert.equal(codes.length, 10);
    await assert.rejects(
      pg.query(
        "INSERT INTO admin_sessions(token_hash, credential_version, expires_at, user_id) VALUES ('old-deployment-token', 'old-version', NOW()+INTERVAL '1 hour', $1)",
        [user.id],
      ),
      /security version/,
    );
    assert.equal(new Set(codes).size, 10);
    assert.equal(await service.currentAdministrator(), null);
    assert.equal((await pg.query("SELECT * FROM admin_sessions")).rows.length, 0);
    const stored = JSON.stringify((await pg.query("SELECT * FROM admin_recovery_codes")).rows);
    for (const code of codes) assert.ok(!stored.includes(code));
    assert.ok(
      !JSON.stringify((await pg.query("SELECT * FROM admin_events")).rows).includes(active.secret),
    );
    const challenge = await service.loginAdministrator(password);
    assert.equal(challenge.requiresTwoFactor, true);
    assert.equal(await service.currentAdministrator(), null);
    await assert.rejects(service.loginAdministrator("wrong", "admin", codes[0]), /incorrecta/);
    await assert.rejects(service.loginAdministrator(password, "admin", activationCode), /inválido/);
    const failedLogins = (await pg.query("SELECT * FROM admin_events WHERE action='login:failure'"))
      .rows;
    assert.equal(failedLogins.length, 2, "invalid passwords and consumed TOTP proofs are audited");
    assert.ok(
      failedLogins.every((event) => event.actor_username === null && event.after_value === null),
    );
    const failureText = JSON.stringify(failedLogins);
    for (const sensitive of [password, codes[0], activationCode, active.secret])
      assert.ok(!failureText.includes(sensitive), "audit never stores credentials or factors");
    await assert.rejects(
      service.listVolunteerRequests({ page: 1, search: "", status: "", trash: false }),
      /no autorizado/,
    );
    await pg.exec("DELETE FROM request_limits");
    const current = otp.generate();
    // Parallel submissions: the same proof must not mint two sessions.
    isolatedLoginRequests = true; // separate browsers arrive with no session cookie
    const results = await Promise.allSettled([
      service.loginAdministrator(password, "admin", current),
      service.loginAdministrator(password, "admin", current),
    ]);
    isolatedLoginRequests = false;
    cookies.set("vne-admin-session", lastIssuedCookie);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await pg.query("SELECT * FROM admin_sessions")).rows.length, 1);
    await service.logoutAdministrator();
    await assert.rejects(service.loginAdministrator(password, "admin", current), /inválido/);
    await service.loginAdministrator(password, "admin", codes[0]);
    assert.equal((await mfa.twoFactorStatus()).remaining, 9);
    await service.logoutAdministrator();
    await assert.rejects(service.loginAdministrator(password, "admin", codes[0]), /inválido/);
    await pg.exec("DELETE FROM request_limits");
    await service.loginAdministrator(password, "admin", codes[1]);
    site = "cross-site";
    await assert.rejects(
      mfa.disableTwoFactor(password, otp.generate({ timestamp: Date.now() + 30000 })),
      /Forbidden/,
    );
    site = "same-origin";
    // Missing/wrong encryption keys must never degrade login to password-only.
    const key = process.env.ADMIN_TOTP_ENCRYPTION_KEY;
    delete process.env.ADMIN_TOTP_ENCRYPTION_KEY;
    await assert.rejects(service.loginAdministrator(password, "admin", current), /ENCRYPTION_KEY/);
    process.env.ADMIN_TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    await assert.rejects(service.loginAdministrator(password, "admin", current));
    process.env.ADMIN_TOTP_ENCRYPTION_KEY = key;
    await pg.exec("DELETE FROM request_limits");
    await service.loginAdministrator(password, "admin", codes[2]);
    await assert.rejects(mfa.disableTwoFactor(password, current), /utilizado/);
    await mfa.disableTwoFactor(password, otp.generate({ timestamp: Date.now() + 30000 }));
    assert.equal(await service.currentAdministrator(), null);
    assert.equal((await pg.query("SELECT * FROM admin_recovery_codes")).rows.length, 0);
    assert.equal((await pg.query("SELECT * FROM admin_sessions")).rows.length, 0);
    await service.loginAdministrator(password);
    assert.equal((await mfa.twoFactorStatus()).enabled, false);
    // Old session security versions cannot be resurrected after a 2FA change.
    await assert.rejects(
      pg.query("UPDATE admin_sessions SET totp_version=0 WHERE user_id=$1", [user.id]),
      /security version/,
    );
    await service.logoutAdministrator();
    assert.equal(await service.currentAdministrator(), null);
    await pg.exec("DELETE FROM request_limits");
    await service.loginAdministrator(password);
    const replacement = await mfa.beginTwoFactor(password);
    const replacementCodes = (
      await mfa.confirmTwoFactor(
        password,
        authenticator(replacement.secret).generate({ timestamp: Date.now() - 30000 }),
      )
    ).codes;
    await pg.exec("DELETE FROM request_limits");
    await service.loginAdministrator(password, "admin", replacementCodes[0]);
    await assert.rejects(mfa.disableTwoFactor(password, replacementCodes[0]), /utilizado/);
    await mfa.disableTwoFactor(password, replacementCodes[1]);
    assert.equal(await service.currentAdministrator(), null);
    assert.equal((await pg.query("SELECT * FROM admin_recovery_codes")).rows.length, 0);
    assert.equal(
      (await pg.query("SELECT * FROM admin_events WHERE action='2fa:disabled-recovery'")).rows
        .length,
      1,
    );
    await pg.exec("DELETE FROM request_limits");
    await service.loginAdministrator(password);
    for (let i = 0; i < 8; i++) await assert.rejects(mfa.beginTwoFactor("wrong"), /incorrecta/);
    await assert.rejects(mfa.beginTwoFactor(password), /Demasiados/);
  } finally {
    await pg.close();
  }
});
