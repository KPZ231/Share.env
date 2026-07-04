import "server-only"; // build fails if this module is ever imported into client code

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the SERVICE ROLE key  bypasses RLS entirely.
 *
 * Only use this for operations that legitimately need to act outside a
 * user's own permissions, e.g. resolving a public share-link token where
 * there is no logged-in user/session to satisfy RLS. Every call site using
 * this client MUST do its own authorization check in application code
 * (e.g. token validity + expiry + revoked) since the database will not.
 *
 * Never import this in a Client Component, and never expose SUPABASE_SERVICE_ROLE_KEY
 * with a NEXT_PUBLIC_ prefix  see .env.example.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
