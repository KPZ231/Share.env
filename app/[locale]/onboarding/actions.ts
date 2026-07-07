"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/dashboard";
import { isPremiumUser } from "@/lib/profile";
import { FREE_WORKSPACE_LIMIT } from "@/lib/billing";

export type CreateWorkspaceResult = { ok: true; workspaceId: string } | { ok: false; error: string };

/**
 * Creates the caller's workspace. Free-plan cap is enforced here as
 * defense-in-depth  the real boundary is the workspaces_insert_self RLS
 * policy (owner_id = auth.uid()), this check just stops a free user from
 * accumulating unlimited workspaces before that policy would ever object.
 */
export async function createWorkspaceAction(name: string): Promise<CreateWorkspaceResult> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Nazwa workspace'a musi mieć co najmniej 2 znaki." };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: "Nazwa workspace'a jest za długa." };
  }

  const [existing, premium] = await Promise.all([getUserWorkspaces(), isPremiumUser()]);
  if (!premium && existing.length >= FREE_WORKSPACE_LIMIT) {
    return { ok: false, error: "Osiągnięto limit workspace'ów w darmowym planie." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name: trimmed, owner_id: user.id })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: "Nie udało się utworzyć workspace'a. Spróbuj ponownie." };
  }

  return { ok: true, workspaceId: data.id };
}
