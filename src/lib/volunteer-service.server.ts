import { createHmac, randomUUID } from "node:crypto";
import {
  deleteCookie,
  getCookie,
  getRequest,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";
import { dbSource, getSql, type Sql } from "./db.ts";
import { assertSameSiteRequest } from "./auth/isolation.server.ts";
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
import type {
  VolunteerInput,
  VolunteerRequest,
  RequestFilters,
  RequestStatus,
} from "./volunteer-schema";

const COOKIE = "vne-admin-session";
const PAGE_SIZE = 50;
const COLUMNS = `id, nombre, apellido, correo, telefono, mensaje, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS fecha, status`;
export type { VolunteerRequest } from "./volunteer-schema";

function privateResponse() {
  setResponseHeader("Cache-Control", "private, no-store");
}
async function database(): Promise<Sql> {
  if (process.env.VERCEL_ENV === "preview" && process.env.PREVIEW_DATABASE_ISOLATED !== "true") {
    throw new Error(
      "El formulario y el panel están desactivados en esta vista previa hasta configurar una base de datos de pruebas independiente.",
    );
  }
  if (process.env.NODE_ENV === "production" && dbSource !== "neon") {
    throw new Error("Base de datos sin configurar: añade DATABASE_URL en Vercel.");
  }
  return getSql();
}
export async function isAdminAuthenticated(): Promise<boolean> {
  privateResponse();
  const raw = getCookie(COOKIE);
  if (!raw || !validSessionToken(raw)) return false;
  const { password, secret } = adminSettings();
  const sql = await database();
  const rows = await sql.query<{ ok: boolean }>(
    "SELECT true AS ok FROM admin_sessions WHERE token_hash = $1 AND credential_version = $2 AND expires_at > NOW()",
    [tokenHash(raw), credentialVersion(password, secret)],
  );
  return rows.length === 1;
}
async function requireAdmin(): Promise<Sql> {
  assertSameSiteRequest();
  if (!(await isAdminAuthenticated()))
    throw new Error("Acceso no autorizado. Inicia sesión nuevamente.");
  return database();
}
function clientAddress() {
  const h = getRequest()?.headers;
  // Vercel overwrites its dedicated header. Do not trust a caller-supplied XFF there.
  const value = process.env.VERCEL ? h?.get("x-vercel-forwarded-for") : h?.get("x-forwarded-for");
  return (value ?? "unknown").split(",")[0].trim().slice(0, 128);
}
async function enforceLimit(
  sql: Sql,
  scope: "login" | "volunteer",
  allowed: number,
  minutes: number,
) {
  const hash = createHmac("sha256", sessionSecret())
    .update(`${scope}:${clientAddress()}`)
    .digest("hex");
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
  assertSameSiteRequest();
  const sql = await database();
  // A retry of the same request must not create a second record or consume its limit again.
  const existing = await sql.query("SELECT id FROM volunteer_requests WHERE request_key = $1", [
    input.requestKey,
  ]);
  if (existing.length) return { ok: true };
  await enforceLimit(sql, "volunteer", 5, 60);
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
export async function loginAdministrator(inputPassword: string) {
  assertSameSiteRequest();
  privateResponse();
  const { password, secret } = adminSettings();
  const sql = await database();
  await enforceLimit(sql, "login", 8, 15);
  if (!constantEquals(inputPassword, password)) throw new Error("Contraseña incorrecta.");
  const token = newSessionToken();
  const oldToken = getCookie(COOKIE);
  if (oldToken && validSessionToken(oldToken))
    await sql.query("DELETE FROM admin_sessions WHERE token_hash = $1", [tokenHash(oldToken)]);
  await sql.query(
    "INSERT INTO admin_sessions (token_hash, credential_version, expires_at) VALUES ($1, $2, NOW() + ($3::integer * INTERVAL '1 second'))",
    [tokenHash(token), credentialVersion(password, secret), SESSION_SECONDS],
  );
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return { ok: true };
}
export async function logoutAdministrator() {
  assertSameSiteRequest();
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
  const sql = await requireAdmin();
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
) {
  const sql = await requireAdmin();
  const { where, params } = filterSql(filters);
  const until =
    snapshot ??
    (
      await sql.query<{ now: string }>(
        `SELECT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS now`,
      )
    )[0].now;
  const rows = await sql.query<VolunteerRequest>(
    `SELECT ${COLUMNS} FROM volunteer_requests WHERE ${where} AND created_at <= $3::timestamptz
     AND ($4::timestamptz IS NULL OR (created_at, id) < ($4::timestamptz, $5::text))
     ORDER BY created_at DESC, id DESC LIMIT 500`,
    [...params, until, cursor?.fecha ?? null, cursor?.id ?? null],
  );
  return {
    rows,
    snapshot: until,
    next: rows.length === 500 ? { fecha: rows[499].fecha, id: rows[499].id } : null,
  };
}
export async function changeVolunteerRequest(
  id: string,
  action: "trash" | "restore" | "status",
  status?: RequestStatus,
) {
  const sql = await requireAdmin();
  const set =
    "status = COALESCE($3::text, status)" +
    (action === "trash"
      ? ", deleted_at = NOW()"
      : action === "restore"
        ? ", deleted_at = NULL"
        : "");
  const guard = action === "restore" ? "deleted_at IS NOT NULL" : "deleted_at IS NULL";
  // One statement makes the modification and its audit record atomic.
  await sql.query(
    `WITH changed AS (UPDATE volunteer_requests SET ${set} WHERE id = $1 AND ${guard} RETURNING id)
     INSERT INTO admin_events (id, action, request_id) SELECT $2, $4, id FROM changed`,
    [
      id,
      randomUUID(),
      action === "status" ? status : null,
      action === "status" ? `status:${status}` : action,
    ],
  );
  return { ok: true };
}
