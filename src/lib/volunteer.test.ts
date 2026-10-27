import test from "node:test";
import assert from "node:assert/strict";
import { volunteerSchema, requestFiltersSchema } from "./volunteer-schema.ts";
import { formatNationalPhone, PHONE_COUNTRIES } from "./phone.ts";
import { volunteersToCsv } from "./volunteers.ts";
import { assertTurnstileVerification } from "./turnstile.server.ts";
import {
  credentialVersion,
  constantEquals,
  newSessionToken,
  validSessionToken,
  tokenHash,
} from "./admin-session.ts";
const input = {
  nombre: "Ana",
  apellido: "Pérez",
  correo: "ana@example.com",
  telefono: "+507 6000 0000",
  mensaje: "Ayudar",
  requestKey: "3e7a61ad-6491-4893-95e2-af04df8ed012",
  turnstileToken: "test-token",
};
test("server validation rejects malformed input, oversized fields and invalid request keys", () => {
  assert.equal(volunteerSchema.safeParse(input).success, true);
  for (const value of [
    { ...input, correo: "incorrecto" },
    { ...input, telefono: "6000" },
    { ...input, telefono: "+1------" },
    { ...input, telefono: "+0000000000" },
    { ...input, telefono: "+1234567890123456" },
    { ...input, nombre: "x".repeat(101) },
    { ...input, mensaje: "x".repeat(2001) },
    { ...input, requestKey: "not-a-uuid" },
  ])
    assert.equal(volunteerSchema.safeParse(value).success, false);
  assert.equal(volunteerSchema.parse(input).telefono, "+50760000000");
  assert.equal(requestFiltersSchema.safeParse({ page: -1 }).success, false);
  assert.equal(requestFiltersSchema.safeParse({ status: "invalid" }).success, false);
});
test("phone country selection formats national numbers and preserves international storage format", () => {
  const panama = PHONE_COUNTRIES.find((country) => country.code === "PA")!;
  const venezuela = PHONE_COUNTRIES.find((country) => country.code === "VE")!;
  const unitedStates = PHONE_COUNTRIES.find((country) => country.code === "US")!;
  assert.equal(formatNationalPhone("60000000", panama), "6000 0000");
  assert.equal(formatNationalPhone("4121234567", venezuela), "412 123 4567");
  assert.equal(formatNationalPhone("3475550100", unitedStates), "347 555 0100");
  assert.equal(formatNationalPhone("(347) 555-0100", unitedStates), "347 555 0100");
});

test("CSV keeps quotes/newlines and neutralizes formulas including whitespace-prefixed input", () => {
  for (const formula of ["=1+1", "+SUM(1;1)", "-1+1", "@SUM(1;1)", "  =1+1", "\r=1+1"]) {
    const csv = volunteersToCsv([
      { ...input, id: input.requestKey, fecha: "2026-10-21", nombre: formula },
    ]);
    assert.ok(csv.includes(`"\t${formula}"`));
  }
  assert.ok(
    volunteersToCsv([
      { ...input, id: input.requestKey, fecha: "2026-10-21", mensaje: 'Hola "equipo"\nGracias' },
    ]).includes('"Hola ""equipo""\nGracias"'),
  );
});
test("session tokens are random, hashed in storage, and credentials rotate their version", () => {
  const first = newSessionToken();
  const second = newSessionToken();
  assert.notEqual(first, second);
  assert.ok(validSessionToken(first));
  assert.ok(!validSessionToken("v1.old-cookie"));
  assert.notEqual(tokenHash(first), first);
  assert.ok(constantEquals("secret", "secret"));
  assert.ok(!constantEquals("secret", "different"));
  assert.notEqual(credentialVersion("first", "secret"), credentialVersion("second", "secret"));
});

test("Turnstile verification requires success and an exact configured hostname", () => {
  assert.doesNotThrow(() =>
    assertTurnstileVerification(
      { success: true, hostname: "VNE.EXAMPLE.COM." },
      "vne.example.com",
    ),
  );
  for (const [verification, expectedHostname] of [
    [{ success: false, hostname: "vne.example.com" }, "vne.example.com"],
    [{ success: true, hostname: "attacker.example" }, "vne.example.com"],
    [{ success: true }, "vne.example.com"],
    [{ success: true, hostname: "vne.example.com" }, ""],
  ] as const) {
    assert.throws(
      () => assertTurnstileVerification(verification, expectedHostname),
      /La verificación de seguridad ha fallado/,
    );
  }
});
