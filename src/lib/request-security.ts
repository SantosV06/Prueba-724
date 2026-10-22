/** Browser metadata and Origin must agree. Missing metadata never authorizes a mutation. */
export function isTrustedRequest(request: Request, siteUrl?: string): boolean {
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const safe = request.method === "GET" || request.method === "HEAD";
  const navigation =
    safe &&
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document";
  if (site && site !== "same-origin" && site !== "none" && !navigation) return false;
  if (origin) {
    try {
      const allowed = new Set([new URL(request.url).origin]);
      if (siteUrl) allowed.add(new URL(siteUrl).origin);
      if (!allowed.has(origin)) return false;
    } catch {
      return false;
    }
  }
  return safe || !!origin || site === "same-origin";
}
