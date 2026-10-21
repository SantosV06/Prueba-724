import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { dbSource, getSql, type Sql } from "./db";
import { assertSameSiteRequest } from "./auth/isolation.server";

const COOKIE = "vne-admin-session";
const SESSION_SECONDS = 8 * 60 * 60;

export type VolunteerRequest = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  mensaje: string;
  fecha: string;
};

type VolunteerInput = Omit<VolunteerRequest, "id" | "fecha">;

function settings() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (password.length < 14 || secret.length < 32) {
    throw new Error("Configuración pendiente: ADMIN_PASSWORD (14+ caracteres) y ADMIN_SESSION_SECRET (32+ caracteres) en Vercel.");
  }
  return { password, secret };
}

async function database(): Promise<Sql> {
  // A diferencia de una vista previa local, Vercel NUNCA debe guardar datos
  // en PGLite en memoria: se perderían al reiniciar la función.
  if (process.env.NODE_ENV === "production" && dbSource !== "neon") {
    throw new Error("Base de datos sin configurar: añade DATABASE_URL en Vercel.");
  }
  return getSql();
}

function keyForSession(password: string, secret: string) {
  // Cambiar ADMIN_PASSWORD invalida también las sesiones anteriores.
  return createHmac("sha256", secret).update(password).digest();
}

function signature(payload: string, password: string, secret: string) {
  return createHmac("sha256", keyForSession(password, secret))
    .update(payload).digest("base64url");
}

function constantEquals(a: string, b: string): boolean {
  const first = createHash("sha256").update(a).digest();
  const second = createHash("sha256").update(b).digest();
  return timingSafeEqual(first, second);
}

export function isAdminAuthenticated(): boolean {
  let password: string, secret: string;
  try {
    ({ password, secret } = settings());
  } catch {
    return false;
  }
  const raw = getCookie(COOKIE);
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  if (!Number.isSafeInteger(expires) || expires <= Date.now() || expires > Date.now() + SESSION_SECONDS * 1000) return false;
  return constantEquals(parts[2], signature(`v1.${parts[1]}`, password, secret));
}

function requireAdmin(): void {
  assertSameSiteRequest();
  if (!isAdminAuthenticated()) throw new Error("Acceso no autorizado. Inicia sesión nuevamente.");
}

function clientAddress() {
  const h = getRequest()?.headers;
  return (h?.get("x-vercel-forwarded-for") ?? h?.get("x-forwarded-for") ?? h?.get("x-real-ip") ?? "unknown")
    .split(",")[0].trim().slice(0, 128);
}

async function enforceLimit(sql: Sql, scope: "login" | "volunteer", allowed: number, minutes: number) {
  const { secret } = settings();
  const hash = createHmac("sha256", secret).update(`${scope}:${clientAddress()}`).digest("hex");
  const rows = await sql.query<{ hits: number }>(
    `INSERT INTO request_limits (scope, key_hash, started_at, hits)
     VALUES ($1, $2, NOW(), 1)
     ON CONFLICT (scope, key_hash) DO UPDATE SET
       hits = CASE WHEN request_limits.started_at < NOW() - ($3::integer * INTERVAL '1 minute')
                   THEN 1 ELSE request_limits.hits + 1 END,
       started_at = CASE WHEN request_limits.started_at < NOW() - ($3::integer * INTERVAL '1 minute')
                         THEN NOW() ELSE request_limits.started_at END
     RETURNING hits`,
    [scope, hash, minutes],
  );
  if (Number(rows[0]?.hits ?? allowed + 1) > allowed) {
    throw new Error("Demasiados intentos desde esta conexión. Vuelve a intentarlo más tarde.");
  }
  return hash;
}

export async function saveVolunteerRequest(input: VolunteerInput) {
  assertSameSiteRequest();
  settings();
  const sql = await database();
  await enforceLimit(sql, "volunteer", 5, 60);
  const id = randomUUID();
  await sql.query(
    `INSERT INTO volunteer_requests (id, nombre, apellido, correo, telefono, mensaje)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, input.nombre, input.apellido, input.correo, input.telefono, input.mensaje],
  );
  return { ok: true };
}

export async function loginAdministrator(inputPassword: string) {
  assertSameSiteRequest();
  const { password, secret } = settings();
  const sql = await database();
  await enforceLimit(sql, "login", 8, 15);
  if (!constantEquals(inputPassword, password)) {
    throw new Error("Contraseña incorrecta.");
  }
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const payload = `v1.${expires}`;
  setCookie(COOKIE, `${payload}.${signature(payload, password, secret)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: SESSION_SECONDS,
  });
  return { ok: true };
}

export function logoutAdministrator() {
  assertSameSiteRequest();
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
}

export async function listVolunteerRequests(): Promise<VolunteerRequest[]> {
  requireAdmin();
  const sql = await database();
  return sql.query<VolunteerRequest>(
    `SELECT id, nombre, apellido, correo, telefono, mensaje, created_at::text AS fecha
     FROM volunteer_requests ORDER BY created_at DESC LIMIT 1000`,
  );
}

export async function deleteVolunteerRequest(id: string) {
  requireAdmin();
  const sql = await database();
  await sql.query("DELETE FROM volunteer_requests WHERE id = $1", [id]);
  return { ok: true };
}
