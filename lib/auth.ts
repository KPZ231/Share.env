import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side session helpers, shared by Server Components and Server Actions
 * so callers don't hand-roll `supabase.auth.getUser()` boilerplate everywhere.
 * These are convenience/UX checks — RLS policies in supabase/migrations are
 * what actually enforce access, per CLAUDE.md.
 */

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Use in Server Actions / pages that must not run without a session. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
