"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/dashboard";
import { getDecryptedGithubToken } from "@/lib/github-connection";
import { listGithubRepos, listGithubCommits, type GithubRepo, type GithubCommit } from "@/lib/github";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireEditorRole(workspaceId: string): Promise<ActionResult> {
  const workspaces = await getUserWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace || workspace.role === "viewer") {
    return { ok: false, error: "Nie masz uprawnień do edycji tego środowiska." };
  }
  return { ok: true };
}

export async function listMyGithubReposAction(): Promise<
  { ok: true; repos: GithubRepo[] } | { ok: false; error: string }
> {
  await requireUser();
  const token = await getDecryptedGithubToken();
  if (!token) return { ok: false, error: "Połącz konto GitHub, aby wybrać repozytorium." };

  try {
    const repos = await listGithubRepos(token);
    return { ok: true, repos };
  } catch {
    return { ok: false, error: "Nie udało się pobrać repozytoriów z GitHub." };
  }
}

export async function previewRepoCommitsAction(
  owner: string,
  repo: string
): Promise<{ ok: true; commits: GithubCommit[] } | { ok: false; error: string }> {
  await requireUser();
  const token = await getDecryptedGithubToken();
  if (!token) return { ok: false, error: "Połącz konto GitHub, aby zobaczyć commity." };

  try {
    const commits = await listGithubCommits(token, owner, repo);
    return { ok: true, commits };
  } catch {
    return { ok: false, error: "Nie udało się pobrać commitów." };
  }
}

export async function linkEnvironmentRepoAction(
  envFileId: string,
  owner: string,
  repo: string
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  const roleCheck = await requireEditorRole(envFile.workspace_id);
  if (!roleCheck.ok) return roleCheck;

  const { error } = await supabase
    .from("env_files")
    .update({ github_owner: owner, github_repo: repo })
    .eq("id", envFileId);
  if (error) return { ok: false, error: "Nie udało się połączyć repozytorium." };

  revalidatePath(`/environments/${envFileId}`);
  return { ok: true };
}

export async function unlinkEnvironmentRepoAction(envFileId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  const roleCheck = await requireEditorRole(envFile.workspace_id);
  if (!roleCheck.ok) return roleCheck;

  const { error } = await supabase
    .from("env_files")
    .update({ github_owner: null, github_repo: null })
    .eq("id", envFileId);
  if (error) return { ok: false, error: "Nie udało się odłączyć repozytorium." };

  revalidatePath(`/environments/${envFileId}`);
  return { ok: true };
}

export async function disconnectGithubAction(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("github_connections").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: "Nie udało się odłączyć konta GitHub." };

  revalidatePath("/environments");
  return { ok: true };
}
