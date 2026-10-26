import test from "node:test";
import assert from "node:assert/strict";
import { checkAvailability, isSameOriginLanguageRedirect } from "./availability-check.mjs";

const SITE = "https://prueba-724.vercel.app";

function response({ status = 200, location, body = "" }) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => (name.toLowerCase() === "location" ? (location ?? null) : null) },
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

function installFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const href = url instanceof URL ? url.href : String(url);
    calls.push(href);
    assert.equal(init.redirect, "manual");
    const handler = routes[href];
    if (!handler) throw new Error(`unexpected ${href}`);
    return handler();
  };
  return { fetchImpl, calls };
}

test("accepts only a same-origin language redirect", () => {
  const from = new URL(`${SITE}/`);
  assert.equal(isSameOriginLanguageRedirect(from, "/?lang=en"), true);
  assert.equal(isSameOriginLanguageRedirect(from, `${SITE}/?lang=pt`), true);
  assert.equal(isSameOriginLanguageRedirect(from, "https://evil.example/?lang=en"), false);
  assert.equal(isSameOriginLanguageRedirect(from, "/casas?lang=en"), false);
  assert.equal(isSameOriginLanguageRedirect(from, "/?lang=en&next=/admin"), false);
  assert.equal(isSameOriginLanguageRedirect(from, "/?lang=fr"), false);
  assert.equal(isSameOriginLanguageRedirect(from, "/?lang=en&lang=es"), false);
  assert.equal(isSameOriginLanguageRedirect(from, null), false);
});

test("passes when the homepage is already Spanish and health is ok", async () => {
  const { fetchImpl, calls } = installFetch({
    [`${SITE}/`]: () => response({ body: "<title>Fundación VNE</title>" }),
    [`${SITE}/api/health`]: () => response({ body: '{"status":"ok"}' }),
  });
  await checkAvailability(SITE, fetchImpl);
  assert.deepEqual(calls, [`${SITE}/`, `${SITE}/api/health`]);
});

test("follows one stored-language redirect and still requires the public title", async () => {
  const { fetchImpl, calls } = installFetch({
    [`${SITE}/`]: () => response({ status: 307, location: "/?lang=en" }),
    [`${SITE}/?lang=en`]: () => response({ body: "Fundación VNE | Sustainable" }),
    [`${SITE}/api/health`]: () => response({ body: '{"status":"ok"}' }),
  });
  await checkAvailability(`${SITE}/`, fetchImpl);
  assert.deepEqual(calls, [`${SITE}/`, `${SITE}/?lang=en`, `${SITE}/api/health`]);
});

test("rejects off-site hops, a second redirect, a broken page and bad health", async () => {
  const cases = [
    {
      routes: {
        [`${SITE}/`]: () => response({ status: 307, location: "/?lang=en" }),
        [`${SITE}/?lang=en`]: () => response({ status: 302, location: "https://evil.example/" }),
      },
      message: "Availability check redirected: /",
    },
    {
      routes: {
        [`${SITE}/`]: () => response({ status: 301, location: "https://evil.example/?lang=en" }),
      },
      message: "Availability check redirected: /",
    },
    {
      routes: {
        [`${SITE}/`]: () => response({ body: "other site" }),
      },
      message: "Homepage content missing",
    },
    {
      routes: {
        [`${SITE}/`]: () => response({ status: 503, body: "down" }),
      },
      message: "Availability check failed: / HTTP 503",
    },
    {
      routes: {
        [`${SITE}/`]: () => response({ body: "Fundación VNE" }),
        [`${SITE}/api/health`]: () => response({ status: 307, location: "/?lang=en" }),
      },
      message: "Availability check redirected: /api/health",
    },
    {
      routes: {
        [`${SITE}/`]: () => response({ body: "Fundación VNE" }),
        [`${SITE}/api/health`]: () => response({ body: '{"status":"error"}' }),
      },
      message: "Database health check failed",
    },
  ];
  for (const item of cases) {
    const { fetchImpl } = installFetch(item.routes);
    await assert.rejects(checkAvailability(SITE, fetchImpl), { message: item.message });
  }
  await assert.rejects(checkAvailability("http://example.org", fetch), /HTTPS monitoring origin/);
});
