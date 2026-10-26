/**
 * Production availability probe used by .github/workflows/availability.yml.
 * Follows one same-origin language redirect (`?lang=es|en|pt`) because the site
 * redirects `/` when the stored default language is not Spanish. Any other
 * redirect, including a host change, fails closed. `/api/health` must not redirect.
 */
import { pathToFileURL } from "node:url";

const LANGUAGES = new Set(["es", "en", "pt"]);

function sortedQuery(params) {
  return [...params.entries()]
    .sort((left, right) =>
      left[0] === right[0] ? left[1].localeCompare(right[1]) : left[0].localeCompare(right[0]),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/** True only when the redirect stays on the same path and adds exactly one language. */
export function isSameOriginLanguageRedirect(from, location) {
  if (!location) return false;
  let destination;
  try {
    destination = new URL(location, from);
  } catch {
    return false;
  }
  if (destination.origin !== from.origin || destination.pathname !== from.pathname) return false;
  if (destination.username || destination.password || destination.hash) return false;
  const lang = destination.searchParams.getAll("lang");
  if (lang.length !== 1 || !LANGUAGES.has(lang[0])) return false;
  const before = new URLSearchParams(from.search);
  const after = new URLSearchParams(destination.search);
  before.delete("lang");
  after.delete("lang");
  return sortedQuery(before) === sortedQuery(after);
}

function safeDestination(from, location) {
  if (!location) return "(missing)";
  try {
    const destination = new URL(location, from);
    return `${destination.origin}${destination.pathname}`;
  } catch {
    return "(invalid Location header)";
  }
}

async function fetchManual(fetchImpl, url) {
  return fetchImpl(url, { signal: AbortSignal.timeout(25000), redirect: "manual" });
}

/**
 * @param {string} siteInput HTTPS origin to monitor.
 * @param {typeof fetch} [fetchImpl]
 */
export async function checkAvailability(siteInput, fetchImpl = fetch) {
  const site = new URL(siteInput);
  if (site.protocol !== "https:" || site.username || site.password) {
    throw new Error("Configure an HTTPS monitoring origin");
  }

  const home = new URL("/", site);
  let response = await fetchManual(fetchImpl, home);
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!isSameOriginLanguageRedirect(home, location)) {
      console.error(
        `Unexpected redirect for /: HTTP ${response.status}; destination: ${safeDestination(
          home,
          location,
        )}`,
      );
      throw new Error("Availability check redirected: /");
    }
    const next = new URL(location, home);
    console.log(`/: language redirect ${next.searchParams.get("lang")}`);
    response = await fetchManual(fetchImpl, next);
    if (response.status >= 300 && response.status < 400) {
      const nextLocation = response.headers.get("location");
      console.error(
        `Unexpected second redirect for /: HTTP ${response.status}; destination: ${safeDestination(
          next,
          nextLocation,
        )}`,
      );
      throw new Error("Availability check redirected: /");
    }
  }
  if (!response.ok) throw new Error(`Availability check failed: / HTTP ${response.status}`);
  if (!(await response.text()).includes("Fundación VNE")) {
    throw new Error("Homepage content missing");
  }
  console.log("/: OK");

  const healthUrl = new URL("/api/health", site);
  const health = await fetchManual(fetchImpl, healthUrl);
  if (health.status >= 300 && health.status < 400) {
    console.error(
      `Unexpected redirect for /api/health: HTTP ${health.status}; destination: ${safeDestination(
        healthUrl,
        health.headers.get("location"),
      )}`,
    );
    throw new Error("Availability check redirected: /api/health");
  }
  if (!health.ok) throw new Error(`Availability check failed: /api/health HTTP ${health.status}`);
  if ((await health.json()).status !== "ok") throw new Error("Database health check failed");
  console.log("/api/health: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkAvailability(process.env.SITE ?? "").catch((error) => {
    console.error(error instanceof Error ? error.message : "Availability check failed");
    process.exitCode = 1;
  });
}
