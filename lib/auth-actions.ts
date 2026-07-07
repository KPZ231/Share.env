"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getUserWorkspaces, ACTIVE_WORKSPACE_COOKIE } from "@/lib/dashboard";
import { ACCOUNT_2FA_COOKIE } from "@/lib/env-lock";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Don't leave the "this device passed 2FA" cookie behind on a shared
  // computer  the next signer-in on this browser must re-verify.
  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_2FA_COOKIE);

  redirect("/");
}

export type SetActiveWorkspaceResult = { ok: true } | { ok: false; error: string };

/**
 * Switches the dashboard's active workspace. Never trusts the workspaceId
 * from the client at face value  it must already be one of the user's own
 * workspaces (per getUserWorkspaces, which is RLS-scoped) before the cookie
 * is set, otherwise a crafted request could point the dashboard at a
 * workspace the user isn't a member of.
 */
export async function setActiveWorkspaceAction(
  workspaceId: string
): Promise<SetActiveWorkspaceResult> {
  await requireUser();

  const workspaces = await getUserWorkspaces();
  const isMember = workspaces.some((w) => w.id === workspaceId);
  if (!isMember) {
    return { ok: false, error: "You don't have access to that workspace." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  revalidatePath("/dashboard");

  return { ok: true };
}
