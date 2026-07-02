import { createHash, randomBytes } from "node:crypto";

/**
 * Generates a cryptographically secure, URL-safe token for share links.
 * 32 random bytes -> 256 bits of entropy, base64url-encoded (no padding).
 * ponytail: node:crypto covers this; reach for nanoid only if a shorter,
 * client-safe token becomes a requirement.
 */
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * SHA-256 hex digest of a raw share token. The database only ever stores
 * this hash (share_links.token_hash) — never the raw token. To create a
 * share link, hash the raw token before insert; to resolve a link, hash the
 * token from the URL and compare against token_hash.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Minimal self-check — run with `npx tsx lib/tokens.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/tokens.ts")) {
  const a = generateShareToken();
  const b = generateShareToken();
  console.assert(a.length >= 40, "token should be long enough to resist guessing");
  console.assert(a !== b, "two calls must not collide");
  console.assert(/^[A-Za-z0-9_-]+$/.test(a), "token must be URL-safe");

  const hashA1 = hashToken(a);
  const hashA2 = hashToken(a);
  console.assert(hashA1 === hashA2, "hashToken must be deterministic");
  console.assert(hashA1 !== a, "hashToken output must differ from its input");
  console.assert(/^[0-9a-f]{64}$/.test(hashA1), "hashToken must produce a 64-char hex digest");
  console.assert(hashToken(b) !== hashA1, "different tokens must hash differently");

  console.log("lib/tokens.ts self-check passed:", a);
}
