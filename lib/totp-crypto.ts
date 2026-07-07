import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM at-rest encryption for standing bearer credentials (TOTP
 * secrets, GitHub OAuth access tokens)  unlike the rest of the schema (RLS
 * + Supabase's default storage encryption is sufficient there), these are
 * long-lived credentials: anyone who reads one can act as the user
 * indefinitely, so they get an extra application-layer key that never
 * reaches Postgres. Despite the filename, this is domain-agnostic; kept
 * here rather than renamed to avoid a churny rename of an already-deployed
 * env var (TOTP_ENCRYPTION_KEY).
 */

export type EncryptedSecret = { ciphertext: string; iv: string; tag: string };

function getKey(): Buffer {
  const keyHex = process.env.TOTP_ENCRYPTION_KEY;
  if (!keyHex) throw new Error("TOTP_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) throw new Error("TOTP_ENCRYPTION_KEY must be a 32-byte key, 64 hex characters");
  return key;
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret(encrypted: EncryptedSecret): string {
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Kept as aliases so existing TOTP call sites don't need touching.
export const encryptTotpSecret = encryptSecret;
export const decryptTotpSecret = decryptSecret;

// Minimal self-check  run with `npx tsx lib/totp-crypto.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/totp-crypto.ts")) {
  process.env.TOTP_ENCRYPTION_KEY ||= randomBytes(32).toString("hex");

  const secret = "JBSWY3DPEHPK3PXP";
  const encrypted = encryptSecret(secret);
  console.assert(decryptSecret(encrypted) === secret, "encrypt/decrypt must round-trip");
  console.assert(encrypted.ciphertext !== secret, "ciphertext must not equal the plaintext");

  const tampered = { ...encrypted, ciphertext: Buffer.from("tampered!!!!").toString("base64") };
  let threw = false;
  try {
    decryptSecret(tampered);
  } catch {
    threw = true;
  }
  console.assert(threw, "GCM must reject tampered ciphertext instead of silently returning garbage");

  console.log("lib/totp-crypto.ts self-check passed");
}
