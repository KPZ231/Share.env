"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/membership";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 280;

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateWorkspaceAction(
  workspaceId: string,
  values: { name: string; description: string }
): Promise<ActionResult> {
  await assertOwner(workspaceId);

  const name = values.name.trim().slice(0, NAME_MAX_LENGTH);
  if (!name) return { ok: false, error: "Nazwa workspace'u nie może być pusta." };
  const description = values.description.trim().slice(0, DESCRIPTION_MAX_LENGTH);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name, description: description || null },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Called after the browser has already uploaded the new logo directly to
 * Storage (RLS scopes the upload path to "{workspaceId}/...", see the
 * workspace_logos_bucket_write_owner policy). Mirrors profile/actions.ts's
 * confirmAvatarAction.
 */
export async function confirmWorkspaceLogoAction(workspaceId: string, newPath: string): Promise<ActionResult> {
  await assertOwner(workspaceId);
  if (!newPath.startsWith(`${workspaceId}/`)) {
    return { ok: false, error: "Nieprawidłowa ścieżka pliku." };
  }

  const supabase = await createClient();
  const existing = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { logoPath: true } });

  await prisma.workspace.update({ where: { id: workspaceId }, data: { logoPath: newPath } });

  if (existing?.logoPath && existing.logoPath !== newPath) {
    await supabase.storage.from("workspace-logos").remove([existing.logoPath]);
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeWorkspaceLogoAction(workspaceId: string): Promise<ActionResult> {
  await assertOwner(workspaceId);

  const supabase = await createClient();
  const existing = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { logoPath: true } });

  await prisma.workspace.update({ where: { id: workspaceId }, data: { logoPath: null } });

  if (existing?.logoPath) {
    await supabase.storage.from("workspace-logos").remove([existing.logoPath]);
  }

  revalidatePath("/settings");
  return { ok: true };
}
