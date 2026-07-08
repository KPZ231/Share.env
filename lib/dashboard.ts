import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";

export const ACTIVE_WORKSPACE_COOKIE = "active_workspace";

export type UserWorkspace = {
  id: string;
  name: string;
  description: string | null;
  logoPath: string | null;
  role: "owner" | "editor" | "viewer";
  createdAt: string;
};

/**
 * Workspaces the signed-in user belongs to, newest first. RLS-scoped (goes
 * through the caller's Supabase session, not Prisma)  a user can only ever
 * see rows workspace_members policies let them see. Wrapped in React
 * `cache()` so multiple reads in one request (layout + page) dedupe to a
 * single query.
 */
export const getUserWorkspaces = cache(async (): Promise<UserWorkspace[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, description, logo_path, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { referencedTable: "workspaces", ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      role: row.role,
      workspace: Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces,
    }))
    .filter(
      (
        row
      ): row is typeof row & {
        workspace: { id: string; name: string; description: string | null; logo_path: string | null; created_at: string };
      } => row.workspace != null
    )
    .map((row) => ({
      id: row.workspace.id,
      name: row.workspace.name,
      description: row.workspace.description,
      logoPath: row.workspace.logo_path,
      role: row.role,
      createdAt: row.workspace.created_at,
    }));
});

/**
 * Private bucket ("workspace-logos")  mirrors lib/profile.ts's
 * getAvatarSignedUrl. The stored path is never a usable URL on its own.
 */
export async function getWorkspaceLogoSignedUrl(logoPath: string | null): Promise<string | null> {
  if (!logoPath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("workspace-logos").createSignedUrl(logoPath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

/**
 * Resolves which workspace the dashboard should show: the `active_workspace`
 * cookie if it's still a workspace the user belongs to, otherwise the newest
 * one. Returns null for a zero-workspace user instead of auto-provisioning
 * one -- the onboarding flow (app/[locale]/onboarding) is the only place a
 * first workspace gets created; the (app) layout redirects there when this
 * returns null.
 */
export async function resolveActiveWorkspace(): Promise<UserWorkspace | null> {
  await requireUser();

  const workspaces = await getUserWorkspaces();
  if (workspaces.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = activeId ? workspaces.find((w) => w.id === activeId) : undefined;

  return active ?? workspaces[0];
}

export type WorkspaceOverview = {
  environmentCount: number;
  memberCount: number;
  activeShareLinkCount: number;
  recentEnvFiles: { id: string; name: string; createdAt: Date }[];
  freeEnvironmentLimit: number;
};

/**
 * Cached aggregate counts for a workspace's dashboard overview. Prisma
 * bypasses RLS entirely, so callers of this function MUST already have
 * verified membership  the explicit check below (not the cached body) is
 * the real access-control boundary here.
 */
export async function getWorkspaceOverview(workspaceId: string): Promise<WorkspaceOverview> {
  const user = await requireUser();

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
    select: { workspaceId: true, role: true },
  });
  if (!membership) {
    throw new Error("Not a member of this workspace");
  }
  const isOwner = membership.role === "owner";

  // recentEnvFiles must respect per-member hiding, so the cache key includes the
  // viewer (owner bypasses hiding, so all owners share one cache entry).
  const overview = await unstable_cache(
    async () => {
      const now = new Date();

      const [environmentCount, memberCount, activeShareLinkCount, recentEnvFiles] =
        await Promise.all([
          prisma.envFile.count({ where: { workspaceId } }),
          prisma.workspaceMember.count({ where: { workspaceId } }),
          prisma.shareLink.count({
            where: {
              revoked: false,
              expiresAt: { gt: now },
              envFile: { workspaceId },
            },
          }),
          prisma.envFile.findMany({
            where: isOwner ? { workspaceId } : { workspaceId, hiddenFor: { none: { userId: user.id } } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, name: true, createdAt: true },
          }),
        ]);

      return { environmentCount, memberCount, activeShareLinkCount, recentEnvFiles };
    },
    [workspaceId, isOwner ? "owner" : user.id],
    { tags: [`ws:${workspaceId}`], revalidate: 60 }
  )();

  return { ...overview, freeEnvironmentLimit: FREE_ENVIRONMENT_LIMIT };
}

const ENVIRONMENTS_PAGE_SIZE = 50;

/**
 * All env files in a workspace, newest first. Same trust model as
 * getWorkspaceOverview: Prisma bypasses RLS, so the membership check here is
 * the real access-control boundary.
 * ponytail: flat take(50), add cursor pagination once a workspace can plausibly exceed it.
 */
export async function getWorkspaceEnvFiles(
  workspaceId: string
): Promise<{ id: string; name: string; createdAt: Date }[]> {
  const user = await requireUser();

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
    select: { workspaceId: true, role: true },
  });
  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  // Owners bypass hiding (mirrors the env_files/storage RLS policies); everyone
  // else must not see files the owner explicitly hid from them.
  return prisma.envFile.findMany({
    where:
      membership.role === "owner"
        ? { workspaceId }
        : { workspaceId, hiddenFor: { none: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    take: ENVIRONMENTS_PAGE_SIZE,
    select: { id: true, name: true, createdAt: true },
  });
}
