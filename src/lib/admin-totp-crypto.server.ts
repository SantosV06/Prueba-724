import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { Secret, TOTP } from "otpauth";

function encryptionKey() {
  const encoded = process.env.ADMIN_TOTP_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32 || key.toString("base64") !== encoded)
    throw new Error(
      "Configura ADMIN_TOTP_ENCRYPTION_KEY con una clave aleatoria de 32 bytes en Base64.",
    );
  return key;
}
export function totpConfigured() {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}
export function encryptTotp(secret: string, userId: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`vne-totp:v1:${userId}`));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}
export function decryptTotp(value: string, userId: string) {
  const [version, iv, tag, data, extra] = value.split(".");
  if (version !== "v1" || !iv || !tag || !data || extra) throw new Error("Secreto 2FA inválido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(`vne-totp:v1:${userId}`));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
export function authenticator(secret: string, username = "admin") {
  return new TOTP({
    issuer: "Fundación VNE",
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}
export const newTotpSecret = () => new Secret({ size: 20 }).base32;
export function verifyTotpStep(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const delta = authenticator(secret).validate({ token: code, timestamp: now, window: 1 });
  return delta === null ? null : Math.floor(now / 30000) + delta;
}
export const newRecoveryCodes = () =>
  Array.from({ length: 10 }, () => randomBytes(10).toString("hex").match(/.{5}/g)!.join("-"));
export function recoveryHash(userId: string, code: string) {
  const normalized = code.replace(/[-\s]/g, "").toLowerCase();
  return /^[a-f0-9]{20}$/.test(normalized)
    ? createHash("sha256").update(`vne-recovery:${userId}:${normalized}`).digest("hex")
    : null;
}
