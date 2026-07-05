import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Ensures the signed-in user has at least one workspace, creating a default
 * one on first login. Idempotent  safe to call on every callback/signin.
 * Uses the caller's RLS-scoped client only: the insert can only ever succeed
 * for the caller's own owner_id (workspaces_insert_self policy), so this can
 * never create a workspace on another user's behalf even if misused.
 */
export async function ensureDefaultWorkspace(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ensureDefaultWorkspace requires an authenticated user");

  const { data: existingMembership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // maybeSingle() returns { data: null, error: null } for zero rows  only an
  // actual error is unexpected here.
  if (membershipError) throw membershipError;
  if (existingMembership) return;

  // handle_new_workspace trigger inserts the owner's workspace_members row
  // atomically  no separate membership insert needed here.
  const { error: insertError } = await supabase
    .from("workspaces")
    .insert({ name: "My workspace", owner_id: user.id });

  if (insertError) throw insertError;
}
