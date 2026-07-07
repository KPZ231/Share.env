/**
 * ponytail: in-memory per-instance throttle. Fine for a single Vercel
 * function instance under light abuse; swap for Upstash/Arcjet if real abuse
 * shows up or the app scales to multiple concurrent instances (a restart or
 * cold start also silently resets counts  acceptable for a soft throttle,
 * not for anything security-critical on its own).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if `key` (e.g. `${ip}:${envFileId}` or `${ip}:invite`) is
 * still under `limit` attempts within `windowMs`, and records this attempt.
 * Returns false once the limit is hit until the window resets.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

// Minimal self-check  run with `npx tsx lib/rate-limit.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/rate-limit.ts")) {
  const key = "self-check";
  console.assert(checkRateLimit(key, 3, 60_000), "1st attempt allowed");
  console.assert(checkRateLimit(key, 3, 60_000), "2nd attempt allowed");
  console.assert(checkRateLimit(key, 3, 60_000), "3rd attempt allowed");
  console.assert(!checkRateLimit(key, 3, 60_000), "4th attempt blocked");
  console.assert(checkRateLimit("other-key", 3, 60_000), "different key has its own bucket");
  console.log("lib/rate-limit.ts self-check passed");
}
