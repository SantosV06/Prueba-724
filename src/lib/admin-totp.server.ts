import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { deleteCookie, setResponseHeader } from "@tanstack/react-start/server";
import {
  requireAdmin,
  enforceLimit,
  COOKIE,
  type StoredAdmin,
} from "./volunteer-service.server.ts";
import { credentialVersion, sessionSecret } from "./admin-session.ts";
import { verifyPassword } from "./password.server.ts";
import {
  authenticator,
  encryptTotp,
  decryptTotp,
  newTotpSecret,
  verifyTotpStep,
  newRecoveryCodes,
  recoveryHash,
  totpConfigured,
} from "./admin-totp-crypto.server.ts";

export async function twoFactorStatus() {
  const { sql, actor } = await requireAdmin({ allowEnrollment: true });
  const [row] = await sql.query<{ enabled: boolean; remaining: number }>(
    `SELECT totp_secret IS NOT NULL AS enabled,
      (SELECT count(*) FROM admin_recovery_codes WHERE user_id=$1) AS remaining FROM admin_users WHERE id=$1`,
    [actor.id],
  );
  return { ...row, configured: totpConfigured() };
}
async function reauthenticate(password: string) {
  setResponseHeader("Cache-Control", "private, no-store");
  const context = await requireAdmin({ allowEnrollment: true });
  await enforceLimit(context.sql, "login", 8, 5, `mfa-manage:${context.actor.id}`);
  const [user] = await context.sql.query<StoredAdmin>(
    `SELECT id, username, password_hash AS "passwordHash", enabled, totp_secret, totp_version, totp_last_step FROM admin_users WHERE id=$1 AND enabled=true`,
    [context.actor.id],
  );
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    throw new Error("Contraseña incorrecta.");
  return { ...context, user };
}
export async function beginTwoFactor(password: string) {
  const { sql, user } = await reauthenticate(password);
  if (user.totp_secret) throw new Error("2FA ya está activo.");
  const secret = newTotpSecret();
  const encrypted = encryptTotp(secret, user.id);
  const qr = await QRCode.toDataURL(authenticator(secret, user.username).toString(), {
    width: 256,
    margin: 4,
  });
  const rows = await sql.query(
    `INSERT INTO admin_totp_pending(user_id, encrypted_secret, credential_version, expires_at)
     SELECT id, $2, $3, NOW()+INTERVAL '10 minutes' FROM admin_users
     WHERE id=$1 AND enabled=true AND password_hash=$4 AND totp_secret IS NULL AND totp_version=$5
     ON CONFLICT(user_id) DO UPDATE SET encrypted_secret=EXCLUDED.encrypted_secret,
       credential_version=EXCLUDED.credential_version, expires_at=EXCLUDED.expires_at RETURNING user_id`,
    [
      user.id,
      encrypted,
      credentialVersion(user.passwordHash, sessionSecret()),
      user.passwordHash,
      user.totp_version,
    ],
  );
  if (!rows.length) throw new Error("Las credenciales cambiaron. Inicia sesión nuevamente.");
  return { secret, qr };
}
export async function confirmTwoFactor(password: string, code: string) {
  const { sql, user } = await reauthenticate(password);
  const [pending] = await sql.query<{ encrypted_secret: string }>(
    `SELECT encrypted_secret FROM admin_totp_pending WHERE user_id=$1 AND expires_at>NOW() AND credential_version=$2`,
    [user.id, credentialVersion(user.passwordHash, sessionSecret())],
  );
  if (!pending || user.totp_secret) throw new Error("La configuración caducó. Vuelve a comenzar.");
  const step = verifyTotpStep(decryptTotp(pending.encrypted_secret, user.id), code);
  if (step === null) throw new Error("Código de autenticación inválido.");
  const codes = newRecoveryCodes();
  const hashes = codes.map((code) => recoveryHash(user.id, code));
  const result = await sql.query(
    `WITH changed AS (
       UPDATE admin_users u SET totp_secret=p.encrypted_secret, totp_last_step=$2, totp_version=u.totp_version+1
       FROM admin_totp_pending p WHERE u.id=$1 AND p.user_id=u.id AND u.enabled=true AND u.password_hash=$3
       AND u.totp_secret IS NULL AND u.totp_version=$4 AND p.encrypted_secret=$5
       AND p.expires_at>NOW() AND p.credential_version=$6 RETURNING u.id
     ), cleared AS (DELETE FROM admin_totp_pending WHERE user_id IN (SELECT id FROM changed)),
     saved AS (INSERT INTO admin_recovery_codes(user_id, code_hash)
       SELECT id, h FROM changed CROSS JOIN unnest($7::text[]) h RETURNING user_id)
     INSERT INTO admin_events(id, action, actor_id, actor_username)
       SELECT $8, '2fa:enabled', id, $9 FROM changed RETURNING id`,
    [
      user.id,
      step,
      user.passwordHash,
      user.totp_version,
      pending.encrypted_secret,
      credentialVersion(user.passwordHash, sessionSecret()),
      hashes,
      randomUUID(),
      user.username,
    ],
  );
  if (!result.length) throw new Error("La configuración cambió o caducó. Vuelve a comenzar.");
  deleteCookie(COOKIE, { path: "/" });
  return { codes };
}
export async function disableTwoFactor(password: string, code: string) {
  const { sql, user } = await reauthenticate(password);
  if (!user.totp_secret) throw new Error("2FA no está activo.");
  const [policy] = await sql.query<{ required: boolean }>(
    "SELECT require_two_factor AS required FROM admin_policy WHERE id=1",
  );
  if (policy.required)
    throw new Error(
      "El propietario exige 2FA. No puedes desactivarlo mientras esta política esté activa.",
    );
  const recovery = recoveryHash(user.id, code);
  const step = recovery ? null : verifyTotpStep(decryptTotp(user.totp_secret, user.id), code);
  if (step === null && recovery === null)
    throw new Error("Usa un código vigente o un código de recuperación sin utilizar.");
  const result = await sql.query(
    `WITH changed AS (
       UPDATE admin_users SET totp_secret=NULL, totp_last_step=NULL, totp_version=totp_version+1
       WHERE id=$1 AND enabled=true AND password_hash=$2 AND totp_version=$3 AND totp_secret=$4
       AND (($5::bigint IS NOT NULL AND (totp_last_step IS NULL OR totp_last_step<$5::bigint))
         OR ($8::text IS NOT NULL AND EXISTS (SELECT 1 FROM admin_recovery_codes WHERE user_id=$1 AND code_hash=$8))) RETURNING id
     ), cleared AS (DELETE FROM admin_totp_pending WHERE user_id IN (SELECT id FROM changed)),
     removed AS (DELETE FROM admin_recovery_codes WHERE user_id IN (SELECT id FROM changed))
     INSERT INTO admin_events(id, action, actor_id, actor_username)
       SELECT $6, CASE WHEN $8::text IS NULL THEN '2fa:disabled' ELSE '2fa:disabled-recovery' END, id, $7 FROM changed RETURNING id`,
    [
      user.id,
      user.passwordHash,
      user.totp_version,
      user.totp_secret,
      step,
      randomUUID(),
      user.username,
      recovery,
    ],
  );
  if (!result.length)
    throw new Error("Código ya utilizado o credenciales modificadas. Espera el siguiente código.");
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
}
