import test from "node:test";
import assert from "node:assert/strict";
import { validateDeployEnv } from "./check-deploy-env.mjs";
import { siteOrigin } from "./site-origin.mjs";
const env = {
  VERCEL_ENV: "production",
  DATABASE_URL:
    "postgresql://test:test@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ADMIN_PASSWORD: "test-password-only",
  ADMIN_SESSION_SECRET: "x".repeat(32),
};
test("production validation fails closed without exposing credentials", () => {
  assert.doesNotThrow(() => validateDeployEnv(env));
  assert.throws(() => validateDeployEnv({ ...env, DATABASE_URL: "" }), /DATABASE_URL/);
  assert.throws(() => validateDeployEnv({ ...env, ADMIN_PASSWORD: "short" }), /ADMIN_PASSWORD/);
  assert.throws(
    () => validateDeployEnv({ ...env, ADMIN_SESSION_SECRET: "short" }),
    /ADMIN_SESSION_SECRET/,
  );
  assert.throws(
    () => validateDeployEnv({ ...env, DATABASE_URL: env.DATABASE_URL.replace("-pooler", "") }),
    /pooled/,
  );
  assert.doesNotThrow(() => validateDeployEnv({ VERCEL_ENV: "preview" }));
});
test("canonical origin uses configured production origin only", () => {
  assert.equal(siteOrigin({}), "");
  assert.equal(
    siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "example.vercel.app" }),
    "https://example.vercel.app",
  );
  assert.equal(siteOrigin({ SITE_URL: "https://example.org/" }), "https://example.org");
  assert.throws(() => siteOrigin({ SITE_URL: "https://user:password@example.org" }));
});
