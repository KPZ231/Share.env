import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { parseEnv, type EnvPair } from "@/lib/env-format";
import { unlockCookieName, verifyUnlockToken } from "@/lib/env-lock";

export type EnvironmentDetail = {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  isProtected: boolean;
  protectionLevel: "none" | "password_2fa" | "password_2fa_key";
  /** true when password-protected and the caller hasn't unlocked it in this session  pairs is empty in that case. */
  locked: boolean;
  pairs: EnvPair[];
  githubRepo: { owner: string; name: string } | null;
  description: string | null;
  websiteUrl: string | null;
};

/**
 * Reads one environment's metadata, scoped through the caller's RLS session
 * (never Prisma/admin here)  a non-member gets a null row from Postgres and
 * this returns null, the same as "not found". If the environment is
 * password-protected, the .env blob is only downloaded/decoded once the
 * caller holds a valid unlock cookie (see lib/env-lock.ts + lock-actions.ts)
 *  RLS still gates *who can attempt* to read it, this gates *whether the
 * plaintext is revealed* for members who haven't unlocked it yet.
 */
export async function getEnvironmentDetail(id: string): Promise<EnvironmentDetail | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: envFile, error } = await supabase
    .from("env_files")
    .select(
      "id, name, workspace_id, storage_path, created_at, password_hash, protection_level, github_owner, github_repo, description, website_url"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !envFile) return null;

  const isProtected = !!envFile.password_hash;
  const protectionLevel = (envFile.protection_level ?? "none") as EnvironmentDetail["protectionLevel"];
  const githubRepo =
    envFile.github_owner && envFile.github_repo
      ? { owner: envFile.github_owner, name: envFile.github_repo }
      : null;

  let locked = isProtected;
  if (isProtected) {
    const cookieStore = await cookies();
    const token = cookieStore.get(unlockCookieName(id))?.value;
    locked = !(token && verifyUnlockToken(token, id, user.id));
  }

  if (locked) {
    return {
      id: envFile.id,
      name: envFile.name,
      workspaceId: envFile.workspace_id,
      createdAt: envFile.created_at,
      isProtected,
      protectionLevel,
      locked: true,
      pairs: [],
      githubRepo,
      description: envFile.description,
      websiteUrl: envFile.website_url,
    };
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("env-files")
    .download(envFile.storage_path);
  if (downloadError || !blob) return null;

  const text = await blob.text();

  return {
    id: envFile.id,
    name: envFile.name,
    workspaceId: envFile.workspace_id,
    createdAt: envFile.created_at,
    isProtected,
    protectionLevel,
    locked: false,
    pairs: parseEnv(text),
    githubRepo,
    description: envFile.description,
    websiteUrl: envFile.website_url,
  };
}
