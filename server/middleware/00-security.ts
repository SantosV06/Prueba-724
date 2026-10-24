import { randomBytes } from "node:crypto";
import config from "../../vercel.json";

interface SecurityEvent {
  req: Request;
  url: URL;
}

export default async function securityHeaders(
  event: SecurityEvent,
  next: () => unknown | Promise<unknown>,
) {
  if (event.req.method !== "GET") return next();

  // Generate before SSR so hydration and theme scripts use the response nonce.
  const nonce = randomBytes(18).toString("base64");
  event.req.headers.set("x-vne-csp-nonce", nonce);
  const response = await next();
  if (
    !(response instanceof Response) ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    return response;

  const baseline = config.headers[0].headers.find(
    (header) => header.key === "Content-Security-Policy",
  )!.value;
  const policy = baseline.replace(
    "script-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
  );
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", policy);
  headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
