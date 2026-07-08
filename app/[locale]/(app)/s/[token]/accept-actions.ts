"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { acceptShareLink } from "@/lib/share-links";

export async function acceptShareLinkAction(token: string): Promise<{ ok: false; error: string } | never> {
  const user = await requireUser();
  const result = await acceptShareLink(token, user.id);
  if (!result.ok) return result;

  redirect(`/environments/${result.envFileId}`);
}
