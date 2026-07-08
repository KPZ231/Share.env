import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side session helpers, shared by Server Components and Server Actions
 * so callers don't hand-roll `supabase.auth.getUser()` boilerplate everywhere.
 * These are convenience/UX checks  RLS policies in supabase/migrations are
 * what actually enforce access, per CLAUDE.md.
 */

// Wrapped in React cache() so the many requireUser()/getUser() calls across
// one request (layout, page, several Server Actions) dedupe to a single
// supabase.auth.getUser() network round-trip instead of one each.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Use in Server Actions / pages that must not run without a session. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/signin");
  return user;
}
