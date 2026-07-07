"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { acceptInvite } from "@/lib/invitations";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/dashboard";

export async function acceptInvitationAction(token: string): Promise<{ ok: false; error: string } | never> {
  const user = await requireUser();
  const result = await acceptInvite(token, user.id, user.email ?? null);
  if (!result.ok) return result;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, result.workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}
