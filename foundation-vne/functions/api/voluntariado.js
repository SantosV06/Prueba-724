import { clean, json, readJson } from "./_lib.js";

const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneOk = /^\+?[0-9()\-\s]{8,20}$/;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ ok: false, error: "Base de datos no disponible" }, 503);

  const data = await readJson(request);
  if (!data) return json({ ok: false, error: "Solicitud inválida" }, 400);
  if (clean(data.website, 200)) return json({ ok: true });

  const nombre = clean(data.nombre, 80);
  const apellido = clean(data.apellido, 80);
  const correo = clean(data.correo, 120).toLowerCase();
  const telefono = clean(data.telefono, 24);

  if (!nombre || !apellido || !emailOk.test(correo) || !phoneOk.test(telefono)) {
    return json({ ok: false, error: "Revisa los datos del formulario" }, 400);
  }

  const fecha = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT INTO voluntarios (nombre, apellido, correo, telefono, fecha) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(nombre, apellido, correo, telefono, fecha)
      .run();
  } catch {
    await env.DB.prepare(
      `INSERT INTO voluntarios (nombre, apellido, correo, telefono) VALUES (?, ?, ?, ?)`,
    )
      .bind(nombre, apellido, correo, telefono)
      .run();
  }

  return json({ ok: true });
}
