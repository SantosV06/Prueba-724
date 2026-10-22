import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Fixed, memory-hard parameters; never accept work factors from stored/user input.
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const parts = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(hash);
  if (!parts) return false;
  return timingSafeEqual(await derive(password, parts[1]), Buffer.from(parts[2], "hex"));
}
