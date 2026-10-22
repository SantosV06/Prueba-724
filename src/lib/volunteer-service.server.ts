import { createHmac, randomUUID } from "node:crypto";
import {
  deleteCookie,
  getCookie,
  getRequest,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";
import { dbSource, getSql, type Sql } from "./db.ts";
import { assertTrustedRequest } from "./admin-request.server.ts";
import {
  adminSettings,
  sessionSecret,
  credentialVersion,
  constantEquals,
  newSessionToken,
  validSessionToken,
  tokenHash,
  SESSION_SECONDS,
} from "./admin-session.ts";
import { hashPassword, verifyPassword } from "./password.server.ts";
import type { AdminIdentity, AdminAccount } from "./admin-accounts.ts";
import type {
  VolunteerInput,
  VolunteerRequest,
  RequestFilters,
  RequestStatus,
} from "./volunteer-schema";

export const COOKIE = "vne-admin-session";
const PAGE_SIZE = 50;
const COLUMNS = `id, nombre, apellido, correo, telefono, mensaje, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS fecha, status`;
export type { VolunteerRequest } from "./volunteer-schema";

function privateResponse() {
  setResponseHeader("Cache-Control", "private, no-store");
}
export async function database(): Promise<Sql> {
  if (process.env.VERCEL_ENV === "preview" && process.env.PREVIEW_DATABASE_ISOLATED !== "true") {
    throw new Error(
      "El formulario y el panel están desactivados en esta vista previa hasta configurar una base de datos de pruebas independiente.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    dbSource !== "neon" &&
    !(process.env.E2E_LOCAL_DATABASE === "true" && !process.env.VERCEL)
  ) {
    throw new Error("Base de datos sin configurar: añade DATABASE_URL en Vercel.");
  }
  return getSql();
}
export type StoredAdmin = AdminIdentity & {
  passwordHash: string;
  enabled: boolean;
  totp_secret: string | null;
  totp_version: number;
  totp_last_step: number | null;
};
const LOGIN_COLUMNS = `id, username, display_name AS "displayName", role, enabled, password_hash AS "passwordHash", totp_secret, totp_version, totp_last_step`;
export async function currentAdministrator(): Promise<AdminIdentity | null> {
  privateResponse();
  assertTrustedRequest();
  const raw = getCookie(COOKIE);
  if (!raw || !validSessionToken(raw)) return null;
  const sql = await database();
  const [user] = await sql.query<StoredAdmin & { version: string }>(
    `SELECT u.id, u.username, u.display_name AS "displayName", u.role, u.enabled,
      u.password_hash AS "passwordHash", s.credential_version AS version
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.enabled = true AND s.totp_version = u.totp_version`,
    [tokenHash(raw)],
  );
  if (!user || !constantEquals(user.version, credentialVersion(user.passwordHash, sessionSecret())))
    return null;
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
}
export async function isAdminAuthenticated(): Promise<boolean> {
  return (await currentAdministrator()) !== null;
}
export async function requireAdmin() {
  assertTrustedRequest();
  const actor = await currentAdministrator();
  if (!actor) throw new Error("Acceso no autorizado. Inicia sesión nuevamente.");
  return { sql: await database(), actor };
}
async function requireOwner() {
  const context = await requireAdmin();
  if (context.actor.role !== "owner")
    throw new Error("Solo el propietario puede administrar usuarios.");
  return context;
}
function clientAddress() {
  const h = getRequest()?.headers;
  // Vercel overwrites its dedicated header. Do not trust a caller-supplied XFF there.
  const value = process.env.VERCEL ? h?.get("x-vercel-forwarded-for") : h?.get("x-forwarded-for");
  return (value ?? "unknown").split(",")[0].trim().slice(0, 128);
}
export async function enforceLimit(
  sql: Sql,
  scope: "login" | "volunteer",
  allowed: number,
  minutes: number,
  identity = clientAddress(),
) {
  const hash = createHmac("sha256", sessionSecret()).update(`${scope}:${identity}`).digest("hex");
  // Opportunistic housekeeping, including dormant keys, on real traffic.
  await sql.query("DELETE FROM request_limits WHERE started_at < NOW() - INTERVAL '1 day'");
  await sql.query("DELETE FROM admin_sessions WHERE expires_at <= NOW()");
  const rows = await sql.query<{ hits: number }>(
    `INSERT INTO request_limits (scope, key_hash, started_at, hits) VALUES ($1, $2, NOW(), 1)
     ON CONFLICT (scope, key_hash) DO UPDATE SET
       hits = CASE WHEN request_limits.started_at < NOW() - ($3::integer * INTERVAL '1 minute') THEN 1 ELSE request_limits.hits + 1 END,
       started_at = CASE WHEN request_limits.started_at < NOW() - ($3::integer * INTERVAL '1 minute') THEN NOW() ELSE request_limits.started_at END
     RETURNING hits`,
    [scope, hash, minutes],
  );
  if (Number(rows[0]?.hits ?? allowed + 1) > allowed)
    throw new Error("Demasiados intentos desde esta conexión. Vuelve a intentarlo más tarde.");
}
export async function saveVolunteerRequest(input: VolunteerInput) {
  assertTrustedRequest();
  const sql = await database();
  // A retry of the same request must not create a second record or consume its limit again.
  const existing = await sql.query("SELECT id FROM volunteer_requests WHERE request_key = $1", [
    input.requestKey,
  ]);
  if (existing.length) return { ok: true };
  await enforceLimit(sql, "volunteer", 60, 60);
  await enforceLimit(sql, "volunteer", 5, 60, `email:${input.correo.toLowerCase()}`);
  await sql.query(
    `INSERT INTO volunteer_requests (id, nombre, apellido, correo, telefono, mensaje, request_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (request_key) DO NOTHING`,
    [
      randomUUID(),
      input.nombre,
      input.apellido,
      input.correo,
      input.telefono,
      input.mensaje,
      input.requestKey,
    ],
  );
  return { ok: true };
}
export async function loginAdministrator(inputPassword: string, username = "admin", code = "") {
  assertTrustedRequest();
  privateResponse();
  const sql = await database();
  await enforceLimit(sql, "login", 60, 15);
  // Scope the account budget to the source connection: one attacker must not lock out everyone.
  await enforceLimit(sql, "login", 8, 15, `account:${username}:${clientAddress()}`);
  let [user] = await sql.query<StoredAdmin>(
    `SELECT ${LOGIN_COLUMNS} FROM admin_users WHERE username = $1`,
    [username],
  );
  if (!user && username === "admin") {
    const [count] = await sql.query<{ total: number }>("SELECT count(*) AS total FROM admin_users");
    // The environment password is used ONCE to create the owner, never as a login bypass.
    if (Number(count.total) === 0) {
      const { password } = adminSettings();
      if (!constantEquals(inputPassword, password))
        throw new Error("Usuario o contraseña incorrecta.");
      const hash = await hashPassword(inputPassword);
      await sql.query(
        `INSERT INTO admin_users (id, username, display_name, password_hash, role, bootstrap_key)
         VALUES ($1, 'admin', 'Propietario', $2, 'owner', true) ON CONFLICT DO NOTHING`,
        [randomUUID(), hash],
      );
      [user] = await sql.query<StoredAdmin>(
        `SELECT ${LOGIN_COLUMNS} FROM admin_users WHERE username = 'admin'`,
      );
    }
  }
  // Hash a dummy password for missing accounts too, avoiding a fast username probe.
  const valid = user
    ? await verifyPassword(inputPassword, user.passwordHash)
    : (await hashPassword(inputPassword), false);
  if (!user || !user.enabled || !valid) throw new Error("Usuario o contraseña incorrecta.");
  const oldToken = getCookie(COOKIE);
  if (oldToken && validSessionToken(oldToken))
    await sql.query("DELETE FROM admin_sessions WHERE token_hash = $1", [tokenHash(oldToken)]);
  deleteCookie(COOKIE, { path: "/" });
  if (user.totp_secret && !code) return { ok: false, requiresTwoFactor: true };
  let step: number | null = null;
  let recovery: string | null = null;
  if (user.totp_secret) {
    // This account-wide budget applies only AFTER a correct password, across all IPs.
    await enforceLimit(sql, "login", 8, 5, `mfa:${user.id}`);
    const { decryptTotp, verifyTotpStep, recoveryHash } =
      await import("./admin-totp-crypto.server.ts");
    recovery = recoveryHash(user.id, code);
    step = recovery ? null : verifyTotpStep(decryptTotp(user.totp_secret, user.id), code);
    if (step === null && recovery === null)
      throw new Error("Código de autenticación inválido o ya utilizado.");
  }
  const token = newSessionToken();
  // Lock the account and consume proof in the SAME statement that creates the
  // session and audit. Concurrent logins cannot reuse a TOTP or recovery code.
  const inserted = await sql.query(
    `WITH locked AS MATERIALIZED (
       SELECT * FROM admin_users WHERE id=$4 AND enabled=true AND password_hash=$5
       AND totp_version=$6 AND totp_secret IS NOT DISTINCT FROM $7::text FOR UPDATE
     ), used AS (
       UPDATE admin_users u SET totp_last_step=$8::bigint FROM locked l
       WHERE u.id=l.id AND l.totp_secret IS NOT NULL AND $8::bigint IS NOT NULL
       AND (l.totp_last_step IS NULL OR l.totp_last_step < $8::bigint) RETURNING u.id
     ), recovered AS (
       DELETE FROM admin_recovery_codes r USING locked l WHERE r.user_id=l.id
       AND l.totp_secret IS NOT NULL AND $8::bigint IS NULL AND r.code_hash=$9 RETURNING r.user_id
     ), added AS (
       INSERT INTO admin_sessions (token_hash, credential_version, expires_at, user_id, totp_version)
       SELECT $1, $2, NOW()+($3::integer * INTERVAL '1 second'), l.id, l.totp_version FROM locked l
       WHERE l.totp_secret IS NULL OR EXISTS (SELECT 1 FROM used) OR EXISTS (SELECT 1 FROM recovered)
       RETURNING user_id
     ), audit AS (
       INSERT INTO admin_events(id, action, actor_id, actor_username)
       SELECT $10, CASE WHEN EXISTS (SELECT 1 FROM recovered) THEN 'login:recovery-code' ELSE 'login:success' END, user_id, $11 FROM added RETURNING id
     ) SELECT * FROM audit`,
    [
      tokenHash(token),
      credentialVersion(user.passwordHash, sessionSecret()),
      SESSION_SECONDS,
      user.id,
      user.passwordHash,
      user.totp_version,
      user.totp_secret,
      step,
      recovery,
      randomUUID(),
      user.username,
    ],
  );
  if (!inserted.length)
    throw new Error("Código inválido o credenciales modificadas. Inicia sesión nuevamente.");
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return { ok: true };
}
export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const { sql } = await requireOwner();
  return sql.query<AdminAccount>(
    `SELECT id, username, display_name AS "displayName", role, enabled FROM admin_users ORDER BY created_at, id`,
  );
}
export async function createAdminAccount(input: {
  username: string;
  displayName: string;
  password: string;
}) {
  const { sql, actor } = await requireOwner();
  const hash = await hashPassword(input.password);
  const created = await sql.query(
    `WITH added AS (
       INSERT INTO admin_users (id, username, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin') ON CONFLICT (username) DO NOTHING RETURNING id
     ) INSERT INTO admin_events (id, action, actor_id, actor_username, after_value)
       SELECT $5, 'account:create', $6, $7, jsonb_build_object('userId', id, 'username', $2::text) FROM added RETURNING id`,
    [randomUUID(), input.username, input.displayName, hash, randomUUID(), actor.id, actor.username],
  );
  if (!created.length) throw new Error("Ese nombre de usuario ya existe.");
  return { ok: true };
}
export async function updateAdminAccount(input: {
  id: string;
  enabled?: boolean;
  password?: string;
}) {
  const { sql, actor } = await requireOwner();
  if (input.id === actor.id && input.enabled !== undefined)
    throw new Error("No puedes desactivar tu propia cuenta.");
  const hash = input.password ? await hashPassword(input.password) : null;
  const result = await sql.query(
    `WITH changed AS (
       UPDATE admin_users SET password_hash = COALESCE($2::text, password_hash), enabled = COALESCE($3::boolean, enabled)
       WHERE id = $1 AND ($3::boolean IS NULL OR role <> 'owner') RETURNING id, username, enabled
     ), revoked AS (DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM changed))
     INSERT INTO admin_events (id, action, actor_id, actor_username, after_value)
       SELECT $4, $5, $6, $7, jsonb_build_object('userId', id, 'username', username, 'enabled', enabled) FROM changed RETURNING id`,
    [
      input.id,
      hash,
      input.enabled ?? null,
      randomUUID(),
      hash ? "account:password" : "account:access",
      actor.id,
      actor.username,
    ],
  );
  if (!result.length) throw new Error("No se pudo modificar esa cuenta.");
  return { ok: true, signedOut: input.id === actor.id };
}
export async function logoutAdministrator() {
  assertTrustedRequest();
  privateResponse();
  const raw = getCookie(COOKIE);
  if (raw && validSessionToken(raw)) {
    const sql = await database();
    await sql.query("DELETE FROM admin_sessions WHERE token_hash = $1", [tokenHash(raw)]);
  }
  // Only confirm logout after server-side revocation succeeds.
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
}
function filterSql(filters: Pick<RequestFilters, "search" | "status" | "trash">) {
  // Escape LIKE metacharacters: search is literal, and all values stay bound.
  const search = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
  return {
    where: `deleted_at IS ${filters.trash ? "NOT " : ""}NULL AND ($1 = '%%' OR concat_ws(' ', nombre, apellido, correo, telefono) ILIKE $1) AND ($2 = '' OR status = $2)`,
    params: [search, filters.status],
  };
}
export async function listVolunteerRequests(filters: RequestFilters) {
  const { sql } = await requireAdmin();
  const { where, params } = filterSql(filters);
  const count = await sql.query<{ total: number }>(
    `SELECT count(*) AS total FROM volunteer_requests WHERE ${where}`,
    params,
  );
  const total = Number(count[0]?.total ?? 0);
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const rows = await sql.query<VolunteerRequest>(
    `SELECT ${COLUMNS} FROM volunteer_requests WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return { rows, total, page, pageSize: PAGE_SIZE };
}
export async function exportVolunteerRequests(
  filters: Pick<RequestFilters, "search" | "status" | "trash">,
  cursor?: { fecha: string; id: string },
  snapshot?: string,
  revision?: string,
  exportId: string = randomUUID(),
) {
  const { sql, actor } = await requireAdmin();
  const { where, params } = filterSql(filters);
  const until =
    snapshot ??
    (
      await sql.query<{ now: string }>(
        `SELECT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS now`,
      )
    )[0].now;
  // Rows and revision come from ONE PostgreSQL statement snapshot.
  const [batch] = await sql.query<{ revision: string; rows: VolunteerRequest[] }>(
    `SELECT r.revision::text AS revision, COALESCE(jsonb_agg(p ORDER BY p.fecha DESC, p.id DESC) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb) AS rows
     FROM volunteer_export_revision r LEFT JOIN LATERAL (
       SELECT ${COLUMNS} FROM volunteer_requests WHERE ${where} AND created_at <= $3::timestamptz
       AND ($4::timestamptz IS NULL OR (created_at, id) < ($4::timestamptz, $5::text))
       ORDER BY created_at DESC, id DESC LIMIT 500
     ) p ON true WHERE r.id = 1 GROUP BY r.revision`,
    [...params, until, cursor?.fecha ?? null, cursor?.id ?? null],
  );
  if (revision !== undefined && revision !== batch.revision)
    throw new Error("Las solicitudes cambiaron durante la exportación. Vuelve a descargar el CSV.");
  const rows = batch.rows;
  // Record server delivery, not a completed local download. Never copy volunteer
  // data or the search text into the audit log. If this write fails, no batch
  // is returned to the browser.
  await sql.query(
    `INSERT INTO admin_events (id, action, actor_id, actor_username, after_value)
     VALUES ($1, 'export:batch', $2, $3, $4::jsonb)`,
    [
      randomUUID(),
      actor.id,
      actor.username,
      JSON.stringify({
        exportId,
        rowCount: rows.length,
        status: filters.status,
        trash: filters.trash,
        searchApplied: filters.search.length > 0,
        snapshot: until,
        revision: batch.revision,
        lastBatch: rows.length < 500,
      }),
    ],
  );
  return {
    rows,
    exportId,
    snapshot: until,
    revision: batch.revision,
    next: rows.length === 500 ? { fecha: rows[499].fecha, id: rows[499].id } : null,
  };
}
export async function changeVolunteerRequest(
  id: string,
  action: "trash" | "restore" | "status" | "purge",
  status?: RequestStatus,
) {
  const { sql, actor } = action === "purge" ? await requireOwner() : await requireAdmin();
  if (action === "purge") {
    await sql.query(
      `WITH removed AS (DELETE FROM volunteer_requests WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id)
       INSERT INTO admin_events (id, action, request_id, actor_id, actor_username)
       SELECT $2, 'purge', id, $3, $4 FROM removed`,
      [id, randomUUID(), actor.id, actor.username],
    );
    return { ok: true };
  }
  const set =
    "status = COALESCE($3::text, v.status)" +
    (action === "trash"
      ? ", deleted_at = NOW()"
      : action === "restore"
        ? ", deleted_at = NULL"
        : "");
  const guard = action === "restore" ? "v.deleted_at IS NOT NULL" : "v.deleted_at IS NULL";
  // Row lock ensures the audit contains the actual immediately preceding values.
  await sql.query(
    `WITH previous AS (SELECT id, status, deleted_at FROM volunteer_requests WHERE id = $1 FOR UPDATE),
     changed AS (UPDATE volunteer_requests v SET ${set} FROM previous p
       WHERE v.id = p.id AND ${guard}
       RETURNING v.id, p.status AS old_status, p.deleted_at AS old_deleted, v.status, v.deleted_at)
     INSERT INTO admin_events (id, action, request_id, actor_id, actor_username, before_value, after_value)
     SELECT $2, $4, id, $5, $6, jsonb_build_object('status', old_status, 'deleted_at', old_deleted),
       jsonb_build_object('status', status, 'deleted_at', deleted_at) FROM changed`,
    [
      id,
      randomUUID(),
      action === "status" ? status : null,
      action === "status" ? `status:${status}` : action,
      actor.id,
      actor.username,
    ],
  );
  return { ok: true };
}
