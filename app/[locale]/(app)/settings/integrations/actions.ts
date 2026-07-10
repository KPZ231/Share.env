"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { assertEditor } from "@/lib/membership";
import {
  saveIntegrationConnection,
  deleteIntegrationConnection,
  getIntegrationCredential,
} from "@/lib/integration-connection";
import { getDecryptedGithubToken, getGithubConnectionInfo } from "@/lib/github-connection";
import { getConnector } from "@/lib/integrations/registry";
import { assertValidWebhookUrl } from "@/lib/integrations/webhook-url";
import { decodeBlob } from "@/lib/environment";
import { parseEnv } from "@/lib/env-format";
import type { SyncProvider, SyncTarget } from "@/lib/integrations/connector";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** GitHub Actions has no separate connect step -- it borrows the account's existing GitHub OAuth connection. */
export async function connectGithubActionsAction(workspaceId: string): Promise<ActionResult> {
  await assertEditor(workspaceId); // any editor may re-share their GitHub connection to the workspace
  const info = await getGithubConnectionInfo();
  if (!info) return { ok: false, error: "Najpierw połącz konto GitHub w profilu." };
  const token = await getDecryptedGithubToken();
  if (!token) return { ok: false, error: "Najpierw połącz konto GitHub w profilu." };
  await saveIntegrationConnection(workspaceId, "github-actions", { accessToken: token }, info.login);
  revalidatePath("/settings/integrations");
  return { ok: true };
}

export async function connectTokenIntegrationAction(
  workspaceId: string,
  provider: "gitlab" | "vercel" | "netlify",
  token: string,
  host?: string
): Promise<ActionResult> {
  if (!token.trim()) return { ok: false, error: "Podaj token dostępu." };
  try {
    const credential = provider === "gitlab" ? { token, host: host?.trim() || undefined } : { token };
    await saveIntegrationConnection(workspaceId, provider, credential, null);
    revalidatePath("/settings/integrations");
    return { ok: true };
  } catch {
    return { ok: false, error: "Nie udało się zapisać połączenia." };
  }
}

export async function connectWebhookIntegrationAction(
  workspaceId: string,
  provider: "slack" | "discord",
  webhookUrl: string
): Promise<ActionResult> {
  try {
    const validated = assertValidWebhookUrl(provider, webhookUrl.trim());
    await saveIntegrationConnection(workspaceId, provider, { webhookUrl: validated }, null);
    revalidatePath("/settings/integrations");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Nie udało się zapisać webhooka." };
  }
}

export async function disconnectIntegrationAction(
  workspaceId: string,
  provider: SyncProvider | "slack" | "discord"
): Promise<ActionResult> {
  try {
    await deleteIntegrationConnection(workspaceId, provider);
    revalidatePath("/settings/integrations");
    return { ok: true };
  } catch {
    return { ok: false, error: "Nie udało się odłączyć integracji." };
  }
}

export async function listSyncTargetsAction(
  workspaceId: string,
  provider: SyncProvider
): Promise<{ ok: true; targets: SyncTarget[] } | { ok: false; error: string }> {
  try {
    const credential = await getIntegrationCredential(workspaceId, provider);
    if (!credential) return { ok: false, error: "Integracja nie jest połączona." };
    const connector = getConnector(provider);
    if (connector.kind !== "sync") return { ok: false, error: "Ta integracja nie obsługuje synchronizacji." };
    const targets = await connector.listTargets(credential);
    return { ok: true, targets };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Nie udało się pobrać listy celów." };
  }
}

export async function linkSyncTargetAction(
  envFileId: string,
  provider: SyncProvider,
  target: SyncTarget
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id, sync_targets")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };
  await assertEditor(envFile.workspace_id);

  const syncTargets = { ...(envFile.sync_targets as Record<string, SyncTarget> | null), [provider]: target };
  const { error } = await supabase.from("env_files").update({ sync_targets: syncTargets }).eq("id", envFileId);
  if (error) return { ok: false, error: "Nie udało się zapisać celu synchronizacji." };

  revalidatePath(`/environments/${envFileId}`);
  revalidatePath("/settings/integrations");
  return { ok: true };
}

/**
 * The one place secrets actually leave the platform: decrypts the env file's
 * own blob (same path as any authorized read), then hands the plaintext
 * pairs to the connector for exactly this push -- never persisted, never
 * logged. Every outcome (including failure) is written to
 * IntegrationSyncLog, which stores metadata only, no values.
 */
export async function syncEnvironmentAction(
  envFileId: string,
  provider: SyncProvider
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id, storage_path, password_hash, sync_targets")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };
  await assertEditor(envFile.workspace_id);

  if (envFile.password_hash) {
    return { ok: false, error: "Odblokuj środowisko przed synchronizacją." };
  }

  const target = (envFile.sync_targets as Record<string, SyncTarget> | null)?.[provider];
  if (!target) return { ok: false, error: "Wybierz cel synchronizacji dla tej integracji." };

  const credential = await getIntegrationCredential(envFile.workspace_id, provider);
  if (!credential) return { ok: false, error: "Integracja nie jest połączona." };

  const logFailure = (errorMessage: string) =>
    prisma.integrationSyncLog.create({
      data: {
        workspaceId: envFile.workspace_id,
        envFileId,
        provider,
        targetName: target.name,
        status: "error",
        errorMessage,
        triggeredBy: user.id,
      },
    });

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("env-files")
      .download(envFile.storage_path);
    if (downloadError || !blob) throw new Error("Nie udało się odczytać środowiska.");

    const pairs = parseEnv(decodeBlob(await blob.text()));
    const record: Record<string, string> = {};
    for (const pair of pairs) record[pair.key] = pair.value;

    const connector = getConnector(provider);
    if (connector.kind !== "sync") throw new Error("Ta integracja nie obsługuje synchronizacji.");
    await connector.pushSecrets(credential, target.id, record);

    await prisma.integrationSyncLog.create({
      data: { workspaceId: envFile.workspace_id, envFileId, provider, targetName: target.name, status: "success", triggeredBy: user.id },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synchronizacja nie powiodła się.";
    await logFailure(message);
    return { ok: false, error: message };
  }
}

// re-export for the client component
export type { SyncTarget };
