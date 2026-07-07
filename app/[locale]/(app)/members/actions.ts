"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isEmailValid } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { assertOwner } from "@/lib/membership";
import { createEmailInvite, createLinkInvite, revokeInvitation } from "@/lib/invitations";
import { generateShareToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/env-lock";
import type { WorkspaceRole } from "@prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Mirrors signup/actions.ts's fallbackOrigin  never trust the Host header in production. */
async function siteOrigin(locale: string): Promise<string> {
  let base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
    }
    const host = (await headers()).get("host") ?? "localhost:3000";
    base = `http://${host}`;
  }
  return `${base}/${locale}/invite`;
}

export async function inviteByEmailAction(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  locale: string
): Promise<ActionResult> {
  await requireUser();
  const trimmed = email.trim();
  if (!isEmailValid(trimmed)) return { ok: false, error: "Podaj prawidłowy adres e-mail." };

  const result = await createEmailInvite(workspaceId, trimmed, role, await siteOrigin(locale));
  if (!result.ok) return result;
  revalidatePath("/members");
  return { ok: true };
}

export async function createInviteLinkAction(
  workspaceId: string,
  role: WorkspaceRole,
  locale: string
): Promise<ActionResult & { url?: string }> {
  await requireUser();
  const result = await createLinkInvite(workspaceId, role);
  if (!result.ok) return result;
  revalidatePath("/members");
  return { ok: true, url: `${await siteOrigin(locale)}/${result.token}` };
}

export async function revokeInviteAction(workspaceId: string, invitationId: string): Promise<ActionResult> {
  await requireUser();
  await revokeInvitation(workspaceId, invitationId);
  revalidatePath("/members");
  return { ok: true };
}

export async function changeRoleAction(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole
): Promise<ActionResult> {
  await assertOwner(workspaceId);
  try {
    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
      data: { role },
    });
  } catch {
    // protect_last_owner trigger raises when this would leave zero owners.
    return { ok: false, error: "Workspace musi mieć co najmniej jednego ownera." };
  }
  revalidatePath("/members");
  return { ok: true };
}

export async function removeMemberAction(workspaceId: string, memberId: string): Promise<ActionResult> {
  await assertOwner(workspaceId);
  try {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
    });
  } catch {
    return { ok: false, error: "Nie można usunąć ostatniego ownera." };
  }
  revalidatePath("/members");
  return { ok: true };
}

/** Owner-only: (re)generates a member's Access Key. The raw key is returned exactly once. */
export async function regenerateAccessKeyAction(
  workspaceId: string,
  memberId: string
): Promise<ActionResult & { accessKey?: string }> {
  await assertOwner(workspaceId);

  const rawKey = generateShareToken();
  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: memberId } },
    data: { accessKeyHash: hashPassword(rawKey), accessKeyUpdatedAt: new Date() },
  });

  revalidatePath("/members");
  return { ok: true, accessKey: rawKey };
}

export async function setMemberEnvVisibilityAction(
  workspaceId: string,
  memberId: string,
  envFileId: string,
  hidden: boolean
): Promise<ActionResult> {
  await assertOwner(workspaceId);

  // envFileId/memberId are client-supplied -- confirm both actually belong to
  // this workspace before touching envFileHiddenMember, otherwise an owner of
  // workspace A could pass IDs from workspace B (cross-workspace IDOR).
  const [file, target] = await Promise.all([
    prisma.envFile.findFirst({ where: { id: envFileId, workspaceId }, select: { id: true } }),
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
      select: { userId: true },
    }),
  ]);
  if (!file) return { ok: false, error: "Nie znaleziono pliku." };
  if (!target) return { ok: false, error: "Użytkownik nie jest członkiem." };

  if (hidden) {
    await prisma.envFileHiddenMember.upsert({
      where: { envFileId_userId: { envFileId, userId: memberId } },
      create: { envFileId, userId: memberId, workspaceId },
      update: {},
    });
  } else {
    await prisma.envFileHiddenMember.deleteMany({ where: { envFileId, userId: memberId, workspaceId } });
  }

  revalidatePath("/members");
  return { ok: true };
}
