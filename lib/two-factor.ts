import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

export type TwoFactorStatus = {
  hasTotp: boolean;
  passkeys: { id: string; deviceLabel: string | null; createdAt: string }[];
};

/** Always about the signed-in caller  2FA credentials are inherently self-only, never looked up for anyone else. */
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: totp }, { data: passkeys }] = await Promise.all([
    supabase.from("totp_credentials").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("webauthn_credentials")
      .select("credential_id, device_label, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    hasTotp: !!totp,
    passkeys: (passkeys ?? []).map((p) => ({
      id: p.credential_id,
      deviceLabel: p.device_label,
      createdAt: p.created_at,
    })),
  };
}

export async function hasAnyTwoFactorMethod(): Promise<boolean> {
  const status = await getTwoFactorStatus();
  return status.hasTotp || status.passkeys.length > 0;
}

/**
 * Mirrors "does this user have any 2FA method enrolled" into Supabase auth
 * app_metadata, so the sign-in gate (lib/supabase/proxy-session.ts, which
 * runs on every request) can read it straight off the already-fetched user
 * object instead of querying totp_credentials/webauthn_credentials on every
 * request. Call after any enroll/remove action.
 *
 * MUST use app_metadata via the admin/service-role client, never
 * user_metadata via the caller's own session  user_metadata is
 * user-writable (supabase.auth.updateUser() runs under the caller's own
 * RLS-equivalent session), so a signed-in user could otherwise flip their
 * own has2fa flag to false from the browser console and skip the 2FA gate
 * entirely. app_metadata can only be set by the service role.
 */
export async function syncHasTwoFactorMetadata(): Promise<void> {
  const user = await requireUser();
  const status = await getTwoFactorStatus();
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { has2fa: status.hasTotp || status.passkeys.length > 0 },
  });
}
