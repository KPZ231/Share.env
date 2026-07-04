import "server-only"; // Prisma Client uses a direct DB connection  never bundle it client-side.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma Client. In dev, Next.js hot-reloads modules on every save;
 * without caching on `globalThis` each reload would open a fresh pool of DB
 * connections until the free-tier connection limit is exhausted.
 *
 * Uses DATABASE_URL (Supabase's pooled/pgbouncer connection) via the pg
 * driver adapter  required by Prisma 7, which no longer connects directly
 * from a URL in the schema. `prisma migrate` uses DIRECT_URL instead, see
 * prisma.config.ts.
 *
 * Reminder (see prisma/schema.prisma): this client bypasses RLS  same trust
 * level as lib/supabase/admin.ts. Use it for trusted/server-side operations
 * only, not as a stand-in for per-user, RLS-scoped access.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
