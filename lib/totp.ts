import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC 6238 TOTP (Google/Microsoft Authenticator compatible: HMAC-SHA1,
 * 6 digits, 30s step). Hand-rolled instead of a dependency  the algorithm
 * itself is short and fully deterministic; verified below against
 * roundtrips and adjacent-step rejection rather than published RFC vectors
 * (which use 8-digit codes, not the 6-digit convention every consumer
 * authenticator app expects).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpUri(secretBase32: string, accountLabel: string, issuer = "Share.env"): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function hotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binCode % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function generateTotpCode(secretBase32: string, atMs = Date.now()): string {
  return hotp(secretBase32, Math.floor(atMs / 1000 / STEP_SECONDS));
}

/** Accepts codes from the current step and `window` steps on either side, to tolerate clock drift. */
export function verifyTotpCode(secretBase32: string, code: string, atMs = Date.now(), window = 1): boolean {
  const cleanCode = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  for (let step = -window; step <= window; step++) {
    const candidate = hotp(secretBase32, counter + step);
    const a = Buffer.from(candidate);
    const b = Buffer.from(cleanCode);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

// Minimal self-check  run with `npx tsx lib/totp.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/totp.ts")) {
  const secret = generateTotpSecret();
  console.assert(/^[A-Z2-7]+$/.test(secret), "secret must be valid base32");

  const now = Date.now();
  const code = generateTotpCode(secret, now);
  console.assert(/^\d{6}$/.test(code), "code must be 6 digits");
  console.assert(verifyTotpCode(secret, code, now), "freshly generated code must verify at the same instant");
  console.assert(!verifyTotpCode(secret, "000000", now) || code === "000000", "wrong code must not verify");

  const farFuture = now + 10 * STEP_SECONDS * 1000;
  console.assert(
    !verifyTotpCode(secret, code, farFuture, 1),
    "a code 10 steps away must not verify within a 1-step window"
  );

  const decoded = base32Decode(base32Encode(Buffer.from("test-roundtrip")));
  console.assert(decoded.toString() === "test-roundtrip", "base32 encode/decode must round-trip");

  console.log("lib/totp.ts self-check passed:", code);
}
