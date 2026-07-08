/**
 * One-time backfill: re-encrypts any env-files blobs still stored as plaintext
 * (uploaded before content encryption shipped) so the Supabase bucket never
 * holds a readable .env, only ciphertext envelopes.
 *
 * Run manually: npx tsx scripts/encrypt-existing-blobs.ts
 * Requires TOTP_ENCRYPTION_KEY and the usual Supabase service-role env vars.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { encryptSecret, type EncryptedSecret } from "@/lib/totp-crypto";

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

function isEnvelope(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as Partial<EncryptedSecret>;
    return !!(parsed.ciphertext && parsed.iv && parsed.tag);
  } catch {
    return false;
  }
}

async function main() {
  const supabase = createAdminClient();
  const files = await prisma.envFile.findMany({ select: { id: true, storagePath: true } });

  let encrypted = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("env-files")
      .download(file.storagePath);
    if (downloadError || !blob) {
      failed++;
      continue;
    }

    const text = await blob.text();
    if (isEnvelope(text)) {
      skipped++;
      continue;
    }

    const envelope = JSON.stringify(encryptSecret(text));
    const { error: uploadError } = await supabase.storage
      .from("env-files")
      .upload(file.storagePath, envelope, { contentType: "application/json", upsert: true });
    if (uploadError) {
      failed++;
      continue;
    }
    encrypted++;
  }

  // No content is ever logged here  only counts.
  console.log(`Backfill done. encrypted=${encrypted} already_encrypted=${skipped} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
