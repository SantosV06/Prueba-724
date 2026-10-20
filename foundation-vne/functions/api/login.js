import { createSession, json, passwordsMatch, readJson, sessionCookie } from "./_lib.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ADMIN_PASSWORD || !(env.SESSION_SECRET || env.ADMIN_PASSWORD)) {
    return json({ ok: false, error: "Servidor sin configurar" }, 503);
  }

  const data = await readJson(request);
  const password = typeof data?.password === "string" ? data.password : "";
  if (!password || password.length > 200) return json({ ok: false }, 401);

  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD;
  const valid = await passwordsMatch(secret, password, env.ADMIN_PASSWORD);
  if (!valid) return json({ ok: false }, 401);

  const token = await createSession(secret);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
