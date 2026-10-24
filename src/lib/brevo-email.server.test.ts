import test, { mock } from "node:test";
import assert from "node:assert/strict";
import type { StoredVolunteerInput } from "./volunteer-schema.ts";
import { notifyNewVolunteer } from "./brevo-email.server.ts";

const envKeys = [
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "BREVO_SENDER_NAME",
  "VOLUNTEER_NOTIFICATION_EMAIL",
  "SITE_URL",
] as const;

const volunteer: StoredVolunteerInput = {
  nombre: "Ana <script>alert(1)</script>",
  apellido: "Pérez & Asociados",
  correo: "ana@example.com",
  telefono: "+507 6000 0000",
  mensaje: "Texto privado que no debe aparecer en el aviso interno.",
  requestKey: "3e7a61ad-6491-4893-95e2-af04df8ed012",
};

function withBrevoEnv(
  overrides: Partial<Record<(typeof envKeys)[number], string>>,
  run: () => Promise<void>,
) {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) {
    delete process.env[key];
  }
  Object.assign(process.env, {
    BREVO_API_KEY: "test-api-key-not-real",
    BREVO_SENDER_EMAIL: "verified@example.com",
    VOLUNTEER_NOTIFICATION_EMAIL: "team@example.com",
    SITE_URL: "https://preview.example.com",
    ...overrides,
  });
  return run().finally(() => {
    for (const key of envKeys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("sends confirmation and internal notification with safe content", async () => {
  await withBrevoEnv({}, async () => {
    type CapturedMessage = {
      to: Array<{ email: string }>;
      htmlContent: string;
      textContent: string;
      subject: string;
    };
    const requests: Array<{ url: string; init: RequestInit; body: CapturedMessage }> = [];
    const fetchMock = mock.method(
      globalThis,
      "fetch",
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        const body = JSON.parse(String(init?.body)) as CapturedMessage;
        requests.push({ url, init: init ?? {}, body });
        return new Response(JSON.stringify({ messageId: "mock-message-id" }), { status: 201 });
      },
    );
    try {
      await notifyNewVolunteer(volunteer);
    } finally {
      fetchMock.mock.restore();
    }

    assert.equal(requests.length, 2);
    assert.ok(
      requests.every((request) => request.url === "https://api.brevo.com/v3/smtp/email"),
    );
    assert.ok(requests.every((request) => request.init.method === "POST"));
    assert.ok(
      requests.every(
        (request) =>
          (request.init.headers as Record<string, string>)["api-key"] === "test-api-key-not-real",
      ),
    );

    const confirmation = requests.find(
      (request) => request.body.to[0].email === volunteer.correo,
    );
    const notification = requests.find(
      (request) => request.body.to[0].email === "team@example.com",
    );
    assert.ok(confirmation, "confirmation goes to the volunteer");
    assert.ok(notification, "internal notification goes to the configured mailbox");
    assert.match(confirmation.body.htmlContent, /&lt;script&gt;/);
    assert.match(confirmation.body.htmlContent, /&amp; Asociados/);
    assert.match(notification.body.htmlContent, /&lt;script&gt;/);
    assert.match(notification.body.htmlContent, /https:\/\/preview\.example\.com\/solicitudes/);
    assert.doesNotMatch(notification.body.textContent, /Texto privado/);
    assert.doesNotMatch(notification.body.htmlContent, /Texto privado/);
    assert.equal(notification.body.subject, "Nueva solicitud de voluntariado recibida");
  });
});

test("skips sending when required configuration is missing without exposing configuration", async () => {
  await withBrevoEnv({ BREVO_API_KEY: "" }, async () => {
    let calls = 0;
    const fetchMock = mock.method(globalThis, "fetch", async () => {
      calls += 1;
      return new Response(null, { status: 201 });
    });
    const warningLog: unknown[][] = [];
    const warningMock = mock.method(
      console,
      "warn",
      (...args: unknown[]) => warningLog.push(args),
    );
    try {
      await notifyNewVolunteer(volunteer);
    } finally {
      fetchMock.mock.restore();
      warningMock.mock.restore();
    }
    assert.equal(calls, 0);
    assert.equal(warningLog.length, 1);
    assert.match(String(warningLog[0][0]), /brevo-not-configured/);
    assert.doesNotMatch(JSON.stringify(warningLog), /test-api-key-not-real|ana@example\.com/);
  });
});

test("handles non-success HTTP responses without logging response bodies or personal data", async () => {
  await withBrevoEnv({}, async () => {
    const errors: unknown[][] = [];
    const errorMock = mock.method(console, "error", (...args: unknown[]) => errors.push(args));
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response("private provider detail and ana@example.com", { status: 401 }),
    );
    try {
      await notifyNewVolunteer(volunteer);
    } finally {
      fetchMock.mock.restore();
      errorMock.mock.restore();
    }
    assert.equal(errors.length, 2);
    const logs = JSON.stringify(errors);
    assert.match(logs, /email:send-failed/);
    assert.match(logs, /401/);
    assert.doesNotMatch(logs, /test-api-key-not-real|ana@example\.com|private provider detail/);
  });
});

test(
  "handles network errors without rejecting the saved-request notification flow or logging secrets",
  async () => {
  await withBrevoEnv({}, async () => {
    const errors: unknown[][] = [];
    const errorMock = mock.method(console, "error", (...args: unknown[]) => errors.push(args));
    const fetchMock = mock.method(globalThis, "fetch", async () => {
      throw new Error("network failed with test-api-key-not-real for ana@example.com");
    });
    try {
      await assert.doesNotReject(notifyNewVolunteer(volunteer));
    } finally {
      fetchMock.mock.restore();
      errorMock.mock.restore();
    }
    assert.equal(errors.length, 2);
    const logs = JSON.stringify(errors);
    assert.match(logs, /reason/);
    assert.doesNotMatch(logs, /test-api-key-not-real|ana@example\.com|network failed/);
  });
});
