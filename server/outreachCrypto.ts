import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Encryption for the Gmail refresh token, and the signed `state` that ties Google's redirect back to an admin's
// "Connect Gmail" click. The key is OUTREACH_TOKEN_KEY: 32 random bytes, base64. It never leaves the server.

export function tokenKey(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  const raw = env.OUTREACH_TOKEN_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

/** AES-256-GCM. The result is "v1." + base64url(iv | tag | ciphertext). */
export function encryptToken(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64url")}`;
}

/** Throws if the value was changed or was encrypted with a different key. */
export function decryptToken(sealed: string, key: Buffer): string {
  if (!sealed.startsWith("v1.")) throw new Error("Unknown token format");
  const buf = Buffer.from(sealed.slice(3), "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

const STATE_TTL_MS = 10 * 60 * 1000;

function stateMac(payload: string, key: Buffer) {
  return createHmac("sha256", key).update(`gmail-oauth-state|${payload}`).digest("base64url");
}

/** A short-lived, signed value for the OAuth `state` parameter. */
export function signState(nonce: string, key: Buffer, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ n: nonce, exp: now + STATE_TTL_MS })).toString("base64url");
  return `${payload}.${stateMac(payload, key)}`;
}

/** The nonce inside a state this server signed and that hasn't expired, or null. */
export function verifyState(state: string, key: Buffer, now = Date.now()): string | null {
  const [payload, mac] = state.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(stateMac(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { n, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof n === "string" && typeof exp === "number" && exp > now ? n : null;
  } catch {
    return null;
  }
}
