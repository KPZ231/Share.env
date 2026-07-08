import "server-only";

import { prisma } from "@/lib/prisma";
import { assertEditor } from "@/lib/membership";
import { generateShareToken, hashToken } from "@/lib/tokens";

/**
 * Prisma bypasses RLS  same trust model as lib/invitations.ts. Writes are
 * gated by assertEditor(); resolveShareLink() (read, by a visitor who isn't
 * a member yet) applies the token hash + expiry + revoked checks that would
 * otherwise be RLS's job, mirroring how invitation links work.
 */

export type ShareLinkRow = {
  id: string;
  expiresAt: Date;
  createdAt: Date;
};

export async function listShareLinks(workspaceId: string, envFileId: string): Promise<ShareLinkRow[]> {
  await assertEditor(workspaceId);
  return prisma.shareLink.findMany({
    where: { envFileId, revoked: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, expiresAt: true, createdAt: true },
  });
}

export async function createShareLink(
  workspaceId: string,
  envFileId: string,
  expiresInDays: number
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const userId = await assertEditor(workspaceId);

  // envFileId is client-supplied  confirm it actually belongs to this
  // workspace before linking to it (cross-workspace IDOR guard, same
  // pattern as setMemberEnvVisibilityAction).
  const file = await prisma.envFile.findFirst({ where: { id: envFileId, workspaceId }, select: { id: true } });
  if (!file) return { ok: false, error: "Nie znaleziono środowiska." };

  const rawToken = generateShareToken();
  await prisma.shareLink.create({
    data: {
      envFileId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      createdBy: userId,
    },
  });
  return { ok: true, token: rawToken };
}

export async function revokeShareLink(workspaceId: string, shareLinkId: string): Promise<void> {
  await assertEditor(workspaceId);
  await prisma.shareLink.updateMany({
    where: { id: shareLinkId, envFile: { workspaceId } },
    data: { revoked: true },
  });
}

type ResolvedShareLink = {
  envFileId: string;
  workspaceId: string;
  envFileName: string;
  workspaceName: string;
};

/** Looks up a raw share-link token, applying every validity check in one place. */
export async function resolveShareLink(rawToken: string): Promise<ResolvedShareLink | null> {
  const link = await prisma.shareLink.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { envFile: { select: { id: true, name: true, workspaceId: true, workspace: { select: { name: true } } } } },
  });
  if (!link || link.revoked) return null;
  if (link.expiresAt.getTime() <= Date.now()) return null;

  return {
    envFileId: link.envFile.id,
    workspaceId: link.envFile.workspaceId,
    envFileName: link.envFile.name,
    workspaceName: link.envFile.workspace.name,
  };
}

/**
 * Grants a signed-in user access to take over one environment via a valid
 * share link. Adds them as a workspace viewer if they aren't a member yet
 * (mirrors acceptInvite's idempotency), scoped to just this environment by
 * hiding every other env_file in the workspace for them  the workspace
 * membership itself carries no extra reach beyond what env_file_hidden_members
 * leaves visible. From there on, the environment's own protection level
 * (see lib/env-lock.ts) gates whether they can actually unlock/read it,
 * unchanged from how any other member would be gated.
 */
export async function acceptShareLink(
  rawToken: string,
  userId: string
): Promise<{ ok: true; envFileId: string } | { ok: false; error: string }> {
  const link = await resolveShareLink(rawToken);
  if (!link) return { ok: false, error: "Link jest nieprawidłowy, wygasł lub został odwołany." };

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: link.workspaceId, userId } },
    select: { workspaceId: true },
  });

  if (!existingMembership) {
    await prisma.workspaceMember.create({
      data: { workspaceId: link.workspaceId, userId, role: "viewer" },
    });

    const otherFiles = await prisma.envFile.findMany({
      where: { workspaceId: link.workspaceId, id: { not: link.envFileId } },
      select: { id: true },
    });
    if (otherFiles.length > 0) {
      await prisma.envFileHiddenMember.createMany({
        data: otherFiles.map((f) => ({ envFileId: f.id, userId, workspaceId: link.workspaceId })),
        skipDuplicates: true,
      });
    }
  }

  return { ok: true, envFileId: link.envFileId };
}
