import { randomUUID } from "node:crypto";
import {
  requireOwner,
  requireAdmin,
  enforceLimit,
  type StoredAdmin,
} from "./volunteer-service.server.ts";
import { verifyPassword, hashPassword } from "./password.server.ts";
import { totpConfigured } from "./admin-totp-crypto.server.ts";
import type { AuditEvent, AuditFilters, HomeContent } from "./admin-operations.ts";
import { homeContentSchema } from "./admin-operations.ts";
import { deleteCookie } from "@tanstack/react-start/server";
import { COOKIE } from "./volunteer-service.server.ts";

export async function listAuditEvents(filters: AuditFilters) {
  const { sql } = await requireOwner();
  // Deliberately omit JSON payloads: old records may contain identifiers or data
  // supplied by an operator. The viewer exposes only this small allowlist.
  const params = [filters.actor, filters.action];
  const where = "($1='' OR actor_username=$1) AND ($2='' OR action=$2)";
  const [count] = await sql.query<{ total: number }>(
    `SELECT count(*) AS total FROM admin_events WHERE ${where}`,
    params,
  );
  const total = Number(count.total);
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / 25)));
  const rows = await sql.query<AuditEvent>(
    `SELECT id, action, actor_username AS actor, request_id AS "requestId", created_at::text AS date
     FROM admin_events WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $3`,
    [...params, (page - 1) * 25],
  );
  return { rows, total, page, pageSize: 25 };
}

export async function operationsStatus() {
  const { sql } = await requireOwner();
  const [policy] = await sql.query<{ required: boolean }>(
    "SELECT require_two_factor AS required FROM admin_policy WHERE id=1",
  );
  const [accounts] = await sql.query<{ active: number; protected: number }>(
    "SELECT count(*) FILTER (WHERE enabled) AS active, count(*) FILTER (WHERE enabled AND totp_secret IS NOT NULL) AS protected FROM admin_users",
  );
  const days = Number(process.env.DATA_RETENTION_DAYS);
  return {
    required: policy.required,
    configured: totpConfigured(),
    activeAccounts: Number(accounts.active),
    protectedAccounts: Number(accounts.protected),
    retentionDays: Number.isInteger(days) && days >= 30 && days <= 3650 ? days : null,
  };
}

export async function updateTwoFactorPolicy(required: boolean, password: string) {
  const { sql, actor } = await requireOwner();
  await enforceLimit(sql, "login", 8, 5, `policy:${actor.id}`);
  const [user] = await sql.query<StoredAdmin>(
    `SELECT password_hash AS "passwordHash", totp_secret FROM admin_users WHERE id=$1 AND enabled`,
    [actor.id],
  );
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    throw new Error("Contraseña incorrecta.");
  if (required && (!user.totp_secret || !totpConfigured()))
    throw new Error("Activa 2FA en tu cuenta antes de exigirlo al equipo.");
  // Recheck the owner's credentials and factor in the write statement.
  const changed = await sql.query(
    `WITH changed AS (
       UPDATE admin_policy SET require_two_factor=$1, updated_at=NOW() WHERE id=1
       AND EXISTS(SELECT 1 FROM admin_users WHERE id=$2 AND enabled AND role='owner' AND password_hash=$3
         AND (NOT $1 OR totp_secret IS NOT NULL)) RETURNING id
     ) INSERT INTO admin_events(id,action,actor_id,actor_username,after_value)
       SELECT $4,'security:2fa-policy',$2,$5,jsonb_build_object('required',$1::boolean) FROM changed RETURNING id`,
    [required, actor.id, user.passwordHash, randomUUID(), actor.username],
  );
  if (!changed.length) throw new Error("Las credenciales cambiaron. Inicia sesión nuevamente.");
  return { ok: true };
}

export async function changeOwnPassword(currentPassword: string, password: string) {
  const { sql, actor } = await requireAdmin();
  await enforceLimit(sql, "login", 8, 5, `password:${actor.id}`);
  const [user] = await sql.query<{ hash: string }>(
    "SELECT password_hash AS hash FROM admin_users WHERE id=$1 AND enabled",
    [actor.id],
  );
  if (!user || !(await verifyPassword(currentPassword, user.hash)))
    throw new Error("Contraseña incorrecta.");
  const hash = await hashPassword(password);
  const result = await sql.query(
    `WITH changed AS (UPDATE admin_users SET password_hash=$2 WHERE id=$1 AND enabled AND password_hash=$3 RETURNING id),
     revoked AS (DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM changed))
     INSERT INTO admin_events(id,action,actor_id,actor_username)
       SELECT $4,'account:self-password',id,$5 FROM changed RETURNING id`,
    [actor.id, hash, user.hash, randomUUID(), actor.username],
  );
  if (!result.length) throw new Error("Las credenciales cambiaron. Inicia sesión nuevamente.");
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
}

export async function readHomeContent() {
  const { sql } = await requireOwner();
  const [row] = await sql.query<{ content: HomeContent; revision: number }>(
    "SELECT content,revision FROM site_content WHERE id=1",
  );
  return row
    ? { content: homeContentSchema.parse(row.content), revision: row.revision }
    : { content: null, revision: 0 };
}
export async function saveHomeContent(content: HomeContent, revision: number) {
  const { sql, actor } = await requireOwner();
  const result = await sql.query(
    `WITH saved AS (INSERT INTO site_content(id,content) SELECT 1,$1::jsonb WHERE $2::integer=0
       ON CONFLICT(id) DO UPDATE SET content=EXCLUDED.content,revision=site_content.revision+1,updated_at=NOW()
       WHERE site_content.revision=$2 RETURNING revision),
     updated AS (UPDATE site_content SET content=$1::jsonb,revision=revision+1,updated_at=NOW()
       WHERE id=1 AND revision=$2 AND $2::integer>0 RETURNING revision)
     INSERT INTO admin_events(id,action,actor_id,actor_username)
       SELECT $3,'content:home',$4,$5 WHERE EXISTS(SELECT 1 FROM saved) OR EXISTS(SELECT 1 FROM updated) RETURNING id`,
    [JSON.stringify(content), revision, randomUUID(), actor.id, actor.username],
  );
  if (!result.length) throw new Error("El contenido cambió. Vuelve a cargar antes de guardar.");
  return { ok: true };
}
