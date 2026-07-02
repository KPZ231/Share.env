import { randomBytes } from "node:crypto";

/**
 * Generates a cryptographically secure, URL-safe token for share links.
 * 32 random bytes -> 256 bits of entropy, base64url-encoded (no padding).
 * ponytail: node:crypto covers this; reach for nanoid only if a shorter,
 * client-safe token becomes a requirement.
 */
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

// Minimal self-check — run with `npx tsx lib/tokens.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/tokens.ts")) {
  const a = generateShareToken();
  const b = generateShareToken();
  console.assert(a.length >= 40, "token should be long enough to resist guessing");
  console.assert(a !== b, "two calls must not collide");
  console.assert(/^[A-Za-z0-9_-]+$/.test(a), "token must be URL-safe");
  console.log("lib/tokens.ts self-check passed:", a);
}
