"use server";

import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { resolveActiveWorkspace, getWorkspaceOverview } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";
import { serializeEnv, validatePairs, type EnvPair } from "@/lib/env-format";
import { unlockCookieName, verifyUnlockToken } from "@/lib/env-lock";

const NAME_MAX_LENGTH = 100;

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Creates a new environment: one .env blob in the RLS-protected "env-files"
 * bucket plus its env_files metadata row. Both upload and manual-entry modes
 * in the UI converge to the same `pairs` shape before calling this.
 *
 * The workspace is resolved server-side (never taken from the client) so a
 * caller can't point the write at a workspace they don't belong to  the
 * env_files INSERT/Storage RLS policies (editor+) are the real authorization
 * boundary, this is defense-in-depth plus a friendlier error message.
 */
export async function createEnvironmentAction(values: {
  name: string;
  pairs: EnvPair[];
  githubOwner?: string;
  githubRepo?: string;
}): Promise<ActionResult> {
  await requireUser();

  const workspace = await resolveActiveWorkspace();
  if (!workspace) return { ok: false, error: "Nie znaleziono aktywnego workspace'a." };
  if (workspace.role === "viewer") {
    return { ok: false, error: "Nie masz uprawnień do tworzenia środowisk w tym workspace'ie." };
  }

  const name = values.name.trim().replace(/[\x00-\x1f]/g, "").slice(0, NAME_MAX_LENGTH);
  if (!name) return { ok: false, error: "Podaj nazwę środowiska." };

  // Form-side limits are UX only  re-validate the actual pairs server-side.
  const validation = validatePairs(values.pairs);
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0]?.message ?? "Nieprawidłowe dane środowiska." };
  }
  if (values.pairs.length === 0) {
    return { ok: false, error: "Dodaj co najmniej jedną zmienną." };
  }

  const overview = await getWorkspaceOverview(workspace.id);
  if (overview.environmentCount >= FREE_ENVIRONMENT_LIMIT) {
    return { ok: false, error: "Osiągnięto limit środowisk w darmowym planie." };
  }

  const envFileId = crypto.randomUUID();
  const storagePath = `${workspace.id}/${envFileId}`;
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("env_files").insert({
    id: envFileId,
    workspace_id: workspace.id,
    name,
    storage_path: storagePath,
    github_owner: values.githubOwner ?? null,
    github_repo: values.githubRepo ?? null,
  });
  if (insertError) return { ok: false, error: "Nie udało się utworzyć środowiska." };

  const content = serializeEnv(values.pairs);
  const { error: uploadError } = await supabase.storage
    .from("env-files")
    .upload(storagePath, content, { contentType: "text/plain", upsert: false });

  if (uploadError) {
    // ponytail: best-effort cleanup of the orphaned row; a reconciliation job
    // for storage/DB drift is only worth building once orphans are observed.
    await supabase.from("env_files").delete().eq("id", envFileId);
    return { ok: false, error: "Nie udało się zapisać pliku środowiska." };
  }

  updateTag(`ws:${workspace.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/environments");
  return { ok: true, id: envFileId };
}

/**
 * Overwrites an existing environment's name and/or contents. Relies on RLS
 * (editor+ on env_files UPDATE and the env-files Storage policy) as the real
 * authorization boundary  a viewer's update/upload is rejected by Postgres,
 * not just hidden in the UI.
 */
export async function updateEnvironmentAction(values: {
  id: string;
  name: string;
  pairs: EnvPair[];
}): Promise<ActionResult> {
  const user = await requireUser();

  const name = values.name.trim().replace(/[\x00-\x1f]/g, "").slice(0, NAME_MAX_LENGTH);
  if (!name) return { ok: false, error: "Podaj nazwę środowiska." };

  const validation = validatePairs(values.pairs);
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0]?.message ?? "Nieprawidłowe dane środowiska." };
  }
  if (values.pairs.length === 0) {
    return { ok: false, error: "Dodaj co najmniej jedną zmienną." };
  }

  const supabase = await createClient();

  const { data: envFile, error: fetchError } = await supabase
    .from("env_files")
    .select("id, workspace_id, storage_path, password_hash")
    .eq("id", values.id)
    .maybeSingle();
  if (fetchError || !envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  // Defense in depth: a protected environment must not be editable by
  // directly invoking this action, even bypassing the UI's unlock gate.
  if (envFile.password_hash) {
    const cookieStore = await cookies();
    const token = cookieStore.get(unlockCookieName(values.id))?.value;
    if (!token || !verifyUnlockToken(token, values.id, user.id)) {
      return { ok: false, error: "Odblokuj środowisko, zanim je zmienisz." };
    }
  }

  const { error: updateError } = await supabase
    .from("env_files")
    .update({ name })
    .eq("id", values.id);
  if (updateError) return { ok: false, error: "Nie udało się zapisać środowiska." };

  const content = serializeEnv(values.pairs);
  const { error: uploadError } = await supabase.storage
    .from("env-files")
    .upload(envFile.storage_path, content, { contentType: "text/plain", upsert: true });
  if (uploadError) return { ok: false, error: "Nie udało się zapisać pliku środowiska." };

  updateTag(`ws:${envFile.workspace_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/environments");
  revalidatePath(`/environments/${values.id}`);
  return { ok: true, id: values.id };
}
