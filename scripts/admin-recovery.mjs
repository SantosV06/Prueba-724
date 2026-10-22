#!/usr/bin/env node
/** Offline recovery only: requires database operator access, never exposed as a web endpoint. */
import { randomUUID } from "node:crypto";
import { emitKeypressEvents } from "node:readline";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { hashPassword } from "../src/lib/password.server.ts";

export async function recoverOwner(client, username, password, { resetTwoFactor = false } = {}) {
  if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)) throw new Error("Usuario inválido.");
  if (password.length < 14 || password.length > 256)
    throw new Error("Usa una contraseña de 14 a 256 caracteres.");
  const hash = await hashPassword(password);
  await client.query("BEGIN");
  try {
    const { rows } = await client.query(
      `UPDATE admin_users SET password_hash=$2${resetTwoFactor ? ", totp_secret=NULL, totp_last_step=NULL, totp_version=totp_version+1" : ""} WHERE username=$1 AND role='owner' AND enabled=true RETURNING id`,
      [username, hash],
    );
    if (rows.length !== 1) throw new Error("No se encontró un propietario activo con ese usuario.");
    if (resetTwoFactor) {
      await client.query("DELETE FROM admin_recovery_codes WHERE user_id=$1", [rows[0].id]);
      await client.query("DELETE FROM admin_totp_pending WHERE user_id=$1", [rows[0].id]);
    }
    await client.query("DELETE FROM admin_sessions WHERE user_id=$1", [rows[0].id]);
    await client.query(
      "INSERT INTO admin_events(id, action, actor_username, after_value) VALUES ($1, 'account:recovery', 'database-operator', $2::jsonb)",
      [randomUUID(), JSON.stringify({ userId: rows[0].id, username, resetTwoFactor })],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function readPassword(prompt) {
  if (!process.stdin.isTTY)
    throw new Error(
      "Ejecuta la recuperación en una terminal interactiva; no pases contraseñas por argumentos.",
    );
  process.stdout.write(prompt);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let password = "";
    const done = (error) => {
      process.stdin.removeListener("keypress", keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(password);
    };
    const keypress = (text, key) => {
      if (key?.ctrl && key.name === "c") return done(new Error("Recuperación cancelada."));
      if (key?.name === "return" || key?.name === "enter") return done();
      if (key?.name === "backspace") password = [...password].slice(0, -1).join("");
      else if (
        text &&
        !key?.ctrl &&
        !key?.meta &&
        [...text].every(
          (character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
        )
      )
        password += text;
    };
    process.stdin.on("keypress", keypress);
  });
}

async function main() {
  const username = process.argv[2]?.trim().toLowerCase();
  const resetTwoFactor = process.argv[3] === "--reset-2fa";
  if (!username || (process.argv.length !== 3 && !(process.argv.length === 4 && resetTwoFactor)))
    throw new Error("Uso: npm run admin:recover -- nombre_de_usuario [--reset-2fa]");
  if (resetTwoFactor)
    console.log(
      "Recuperación de emergencia: se eliminará 2FA y sus códigos. Deberás configurarlo de nuevo después de iniciar sesión.",
    );
  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error("Configura DATABASE_URL de forma privada en esta terminal.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode"))
  )
    throw new Error("La recuperación requiere una conexión de Neon con SSL.");
  const password = await readPassword("Nueva contraseña (no se mostrará): ");
  if (password !== (await readPassword("Repite la contraseña: ")))
    throw new Error("Las contraseñas no coinciden.");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  let client;
  try {
    client = await pool.connect();
    await recoverOwner(client, username, password, { resetTwoFactor });
    console.log("Contraseña actualizada. Todas las sesiones de esta cuenta fueron revocadas.");
  } finally {
    client?.release();
    await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    // Do not print driver errors: they can contain database connection details.
    console.error(
      "No se completó la recuperación. Comprueba el usuario, la conexión privada y la contraseña (14–256 caracteres). No se cambian datos si la transacción falla.",
    );
    process.exitCode = 1;
  });
