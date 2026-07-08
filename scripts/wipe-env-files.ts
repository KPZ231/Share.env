/**
 * Deletes ALL env_files rows and ALL objects in the Storage bucket env-files.
 * Dry-run by default  prints counts only. Pass --confirm to actually delete.
 *
 * Usage:
 *   npx tsx scripts/wipe-env-files.ts            (dry run)
 *   npx tsx scripts/wipe-env-files.ts --confirm   (actually deletes)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ponytail: lib/prisma.ts and lib/supabase/admin.ts both import "server-only",
// which hard-throws outside the Next.js bundler  this script runs under plain
// tsx/Node, so it builds equivalent clients directly instead of importing those.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const supabase = createAdminClient();

  const files = await prisma.envFile.findMany({ select: { id: true, storagePath: true } });

  if (!confirm) {
    console.log(`DRY RUN  would delete ${files.length} env_files row(s) and their Storage objects.`);
    console.log("Re-run with --confirm to actually delete.");
    return;
  }

  if (files.length > 0) {
    const paths = files.map((f) => f.storagePath);
    // Storage remove() caps out around 1000 keys per call in practice; chunk to be safe.
    for (let i = 0; i < paths.length; i += 500) {
      const { error } = await supabase.storage.from("env-files").remove(paths.slice(i, i + 500));
      if (error) throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  const { count } = await prisma.envFile.deleteMany({});
  console.log(`Deleted ${count} env_files row(s) and ${files.length} Storage object(s).`);
}

main().finally(() => prisma.$disconnect());
