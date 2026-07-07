import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { WorkspaceRole } from "@prisma/client";

const MEMBERS_PAGE_SIZE = 200; // ponytail: flat take(), add cursor pagination if a workspace outgrows it

/**
 * Prisma bypasses RLS  every exported function here does its own explicit
 * membership/role check before touching data, same pattern as lib/dashboard.ts.
 */
async function assertMember(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!membership) throw new Error("Not a member of this workspace");
  return membership;
}

export async function assertOwner(workspaceId: string): Promise<string> {
  const user = await requireUser();
  const membership = await assertMember(workspaceId, user.id);
  if (membership.role !== "owner") throw new Error("Owner role required");
  return user.id;
}

export type MemberRow = {
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  hasAccessKey: boolean;
  accessKeyUpdatedAt: Date | null;
  displayName: string | null;
};

/** Roster + profile display names, newest membership first. Any member may view it. */
export async function getWorkspaceMembers(workspaceId: string): Promise<MemberRow[]> {
  const user = await requireUser();
  await assertMember(workspaceId, user.id);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    take: MEMBERS_PAGE_SIZE,
    select: { userId: true, role: true, createdAt: true, accessKeyHash: true, accessKeyUpdatedAt: true },
  });

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: members.map((m) => m.userId) } },
    select: { userId: true, displayName: true },
  });
  const displayNameByUser = new Map(profiles.map((p) => [p.userId, p.displayName]));

  return members.map((m) => ({
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    hasAccessKey: m.accessKeyHash != null,
    accessKeyUpdatedAt: m.accessKeyUpdatedAt,
    displayName: displayNameByUser.get(m.userId) ?? null,
  }));
}

/**
 * Owner-only: every hidden (envFileId, userId) pair in the workspace, in one
 * query, keyed by member so the members page can render every row's
 * visibility checkboxes without an N+1 fetch per member.
 */
export async function getWorkspaceHiddenMap(workspaceId: string): Promise<Record<string, string[]>> {
  await assertOwner(workspaceId);

  const rows = await prisma.envFileHiddenMember.findMany({
    where: { workspaceId },
    select: { userId: true, envFileId: true },
  });

  const byUser: Record<string, string[]> = {};
  for (const row of rows) {
    (byUser[row.userId] ??= []).push(row.envFileId);
  }
  return byUser;
}
