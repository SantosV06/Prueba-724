import { json, requireAdmin } from "./_lib.js";

export async function onRequestGet(context) {
  if (!(await requireAdmin(context))) return json({ ok: false }, 401);
  if (!context.env.DB) return json({ ok: false, error: "Base de datos no disponible" }, 503);

  try {
    const data = await context.env.DB.prepare(
      "SELECT id, nombre, apellido, correo, telefono, fecha FROM voluntarios ORDER BY id DESC",
    ).all();
    return json(data.results || []);
  } catch {
    const data = await context.env.DB.prepare(
      "SELECT id, nombre, apellido, correo, telefono FROM voluntarios ORDER BY id DESC",
    ).all();
    return json(data.results || []);
  }
}
