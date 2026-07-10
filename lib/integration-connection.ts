import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { assertOwner } from "@/lib/membership";
import { encryptSecret, decryptSecret } from "@/lib/totp-crypto";
import type { IntegrationProvider } from "@/lib/integrations/connector";

export type IntegrationConnectionInfo = { provider: IntegrationProvider; label: string | null };

/** Every connected provider for a workspace, for display -- never the credential. */
export async function listIntegrationConnections(workspaceId: string): Promise<IntegrationConnectionInfo[]> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("integration_connections")
    .select("provider, label")
    .eq("workspace_id", workspaceId);
  return (data ?? []) as IntegrationConnectionInfo[];
}

/** Decrypts one provider's credential for the calling workspace member -- RLS already scopes the row to members. */
export async function getIntegrationCredential<T = unknown>(
  workspaceId: string,
  provider: IntegrationProvider
): Promise<T | null> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("integration_connections")
    .select("credential_enc, credential_iv, credential_tag")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();
  if (!data) return null;
  const json = decryptSecret({ ciphertext: data.credential_enc, iv: data.credential_iv, tag: data.credential_tag });
  return JSON.parse(json) as T;
}

/**
 * Admin-path decrypt for trusted server-only contexts with no user session --
 * the expiring-links cron and the best-effort notify fan-out (lib/integrations/notify.ts).
 * Same trust level as lib/supabase/admin.ts generally: only call this from
 * code that never takes workspaceId/provider from an unauthenticated client.
 */
export async function getIntegrationCredentialAdmin<T = unknown>(
  workspaceId: string,
  provider: IntegrationProvider
): Promise<T | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integration_connections")
    .select("credential_enc, credential_iv, credential_tag")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();
  if (!data) return null;
  const json = decryptSecret({ ciphertext: data.credential_enc, iv: data.credential_iv, tag: data.credential_tag });
  return JSON.parse(json) as T;
}

/** Owner-only: stores (or replaces) a provider's credential for the workspace. */
export async function saveIntegrationConnection(
  workspaceId: string,
  provider: IntegrationProvider,
  credential: unknown,
  label: string | null
): Promise<void> {
  const userId = await assertOwner(workspaceId);
  const encrypted = encryptSecret(JSON.stringify(credential));
  const supabase = await createClient();
  const { error } = await supabase.from("integration_connections").upsert(
    {
      workspace_id: workspaceId,
      provider,
      label,
      credential_enc: encrypted.ciphertext,
      credential_iv: encrypted.iv,
      credential_tag: encrypted.tag,
      created_by: userId,
    },
    { onConflict: "workspace_id,provider" }
  );
  if (error) throw error;
}

/** Owner-only: removes a provider's connection. */
export async function deleteIntegrationConnection(workspaceId: string, provider: IntegrationProvider): Promise<void> {
  await assertOwner(workspaceId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_connections")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);
  if (error) throw error;
}
