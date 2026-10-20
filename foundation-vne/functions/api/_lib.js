const encoder = new TextEncoder();

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJson(request, maxBytes = 8000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) return null;
  try {
    const data = await request.json();
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function passwordsMatch(secret, attempt, expected) {
  const [left, right] = await Promise.all([hmac(secret, attempt), hmac(secret, expected)]);
  return equalBytes(left, right);
}

export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");
    if (index === -1) continue;
    if (item.slice(0, index) === name) return decodeURIComponent(item.slice(index + 1));
  }
  return "";
}

export async function createSession(secret, hours = 8) {
  const exp = String(Math.floor(Date.now() / 1000) + hours * 3600);
  const signature = bytesToBase64Url(await hmac(secret, exp));
  return `${exp}.${signature}`;
}

export async function sessionValid(secret, token) {
  if (!token || !token.includes(".")) return false;
  const [exp, signature] = token.split(".");
  if (!/^\d+$/.test(exp) || !signature) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  let given;
  try {
    given = base64UrlToBytes(signature);
  } catch {
    return false;
  }
  const expected = await hmac(secret, exp);
  return equalBytes(given, expected);
}

export function sessionCookie(token) {
  const base = "vne_admin=" + encodeURIComponent(token) + "; HttpOnly; Secure; SameSite=Strict; Path=/";
  return token ? base + "; Max-Age=28800" : base + "; Max-Age=0";
}

export async function requireAdmin(context) {
  const secret = context.env.SESSION_SECRET || context.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const token = readCookie(context.request, "vne_admin");
  return (await sessionValid(secret, token)) ? secret : null;
}
