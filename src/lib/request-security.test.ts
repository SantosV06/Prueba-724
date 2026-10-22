import test from "node:test";
import assert from "node:assert/strict";
import { isTrustedRequest } from "./request-security.ts";

test("mutations require browser or Origin proof and reject contradictory metadata", () => {
  const req = (headers: Record<string, string>, method = "POST") =>
    new Request("https://vne.test/action", { method, headers });
  assert.equal(isTrustedRequest(req({})), false);
  assert.equal(isTrustedRequest(req({ origin: "null" })), false);
  assert.equal(isTrustedRequest(req({ origin: "https://evil.test" })), false);
  assert.equal(
    isTrustedRequest(req({ origin: "https://evil.test", "sec-fetch-site": "same-origin" })),
    false,
  );
  assert.equal(isTrustedRequest(req({ origin: "https://vne.test" })), true);
  assert.equal(isTrustedRequest(req({ "sec-fetch-site": "same-origin" })), true);
  assert.equal(
    isTrustedRequest(req({ "sec-fetch-site": "same-site", origin: "https://vne.test" })),
    false,
  );
  assert.equal(isTrustedRequest(req({}, "GET")), true);
  assert.equal(isTrustedRequest(req({ "sec-fetch-site": "cross-site" }, "GET")), false);
  assert.equal(
    isTrustedRequest(
      req(
        {
          "sec-fetch-site": "cross-site",
          "sec-fetch-mode": "navigate",
          "sec-fetch-dest": "document",
        },
        "GET",
      ),
    ),
    true,
  );
  assert.equal(
    isTrustedRequest(req({ origin: "https://canonical.test" }), "https://canonical.test"),
    true,
  );
});
