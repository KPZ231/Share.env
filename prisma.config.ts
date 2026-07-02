import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 moved connection config out of schema.prisma. `prisma migrate` and
// `prisma db pull`/`push` use this file directly; the app's runtime queries
// go through the driver adapter in lib/prisma.ts instead (pooled connection).
// DIRECT_URL is required here because Supabase's pooled DATABASE_URL
// (pgbouncer) doesn't support the DDL Migrate needs.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
