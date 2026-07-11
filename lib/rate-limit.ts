import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * ponytail: falls back to an in-memory per-instance throttle when Upstash
 * env vars are absent (local dev), so `npm run dev` needs no Redis. In
 * production set UPSTASH_REDIS_REST_URL/TOKEN — without them this is not a
 * real cross-instance limit on Vercel's serverless functions.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(key: string, limit: number, windowMs: number): boolean {
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

/**
 * Returns true if `key` (e.g. `${ip}:${envFileId}` or `${ip}:invite`) is
 * still under `limit` attempts within `windowMs`, and records this attempt.
 * Returns false once the limit is hit until the window resets.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) return checkRateLimitInMemory(key, limit, windowMs);
  const { success } = await getLimiter(limit, windowMs).limit(key);
  return success;
}

// Minimal self-check (in-memory path only)  run with `npx tsx lib/rate-limit.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/rate-limit.ts")) {
  const key = "self-check";
  console.assert(checkRateLimitInMemory(key, 3, 60_000), "1st attempt allowed");
  console.assert(checkRateLimitInMemory(key, 3, 60_000), "2nd attempt allowed");
  console.assert(checkRateLimitInMemory(key, 3, 60_000), "3rd attempt allowed");
  console.assert(!checkRateLimitInMemory(key, 3, 60_000), "4th attempt blocked");
  console.assert(checkRateLimitInMemory("other-key", 3, 60_000), "different key has its own bucket");
  console.log("lib/rate-limit.ts self-check passed");
}
