"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { INTEGRATIONS_CATALOG } from "@/lib/integrations";

const BIO_MAX_LENGTH = 280;
const DISPLAY_NAME_MAX_LENGTH = 80;

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Re-validates length limits server-side  the form's `maxLength` is UX only. */
export async function updateProfileAction(values: {
  displayName: string;
  bio: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const displayName = values.displayName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
  const bio = values.bio.trim().slice(0, BIO_MAX_LENGTH);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, bio: bio || null })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Nie udało się zapisać profilu." };

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Called after the browser has already uploaded the new avatar object
 * directly to Storage (RLS scopes the upload path to the caller's own
 * folder, see the avatars_bucket_write_self policy). This just points the
 * profile row at the new object and removes the previous one so orphaned
 * files don't accumulate in the bucket.
 */
export async function confirmAvatarAction(newPath: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!newPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Nieprawidłowa ścieżka pliku." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: newPath })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Nie udało się zapisać awatara." };

  if (existing?.avatar_path && existing.avatar_path !== newPath) {
    await supabase.storage.from("avatars").remove([existing.avatar_path]);
  }

  revalidatePath("/profile");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Nie udało się usunąć awatara." };

  if (existing?.avatar_path) {
    await supabase.storage.from("avatars").remove([existing.avatar_path]);
  }

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateConsentAction(values: {
  marketingConsent: boolean;
  productEmailsConsent: boolean;
}): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      marketing_consent: values.marketingConsent,
      product_emails_consent: values.productEmailsConsent,
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Nie udało się zapisać zgód." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function toggleIntegrationInterestAction(slug: string): Promise<ActionResult> {
  if (!INTEGRATIONS_CATALOG.some((i) => i.slug === slug)) {
    return { ok: false, error: "Nieznana integracja." };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("interested_integrations")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selectError) return { ok: false, error: "Nie udało się zapisać." };

  const current: string[] = existing?.interested_integrations ?? [];
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];

  const { error } = await supabase
    .from("profiles")
    .update({ interested_integrations: next })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Nie udało się zapisać." };

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * GDPR-style data export: everything the signed-in user owns or belongs to,
 * read through their own RLS-scoped session (never Prisma here  this must
 * only ever return what the requester is actually allowed to see). File
 * contents are excluded; env files are listed by metadata only.
 */
export async function exportDataAction(): Promise<{ ok: true; json: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, bio, marketing_consent, product_emails_consent, interested_integrations, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("role, created_at, workspaces(id, name, created_at, env_files(id, name, created_at))")
      .eq("user_id", user.id),
  ]);

  if (membershipsError) return { ok: false, error: "Nie udało się przygotować eksportu." };

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile ?? null,
    workspaceMemberships: memberships ?? [],
  };

  return { ok: true, json: JSON.stringify(payload, null, 2) };
}

/**
 * Permanently deletes the account: the profile row cascades via the
 * profiles_user_id_fkey FK, and workspaces the user solely owns become
 * orphaned per existing workspace RLS (out of scope here to reassign them).
 * Requires the admin client because auth.admin.deleteUser needs the service
 * role  every other action in this file stays on the RLS-scoped client.
 */
export async function deleteAccountAction(confirmEmail: string): Promise<ActionResult> {
  const user = await requireUser();
  if (confirmEmail.trim().toLowerCase() !== user.email?.toLowerCase()) {
    return { ok: false, error: "Wpisany adres e-mail nie zgadza się z kontem." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("deleteAccountAction failed:", error.message);
    return { ok: false, error: "Nie udało się usunąć konta. Spróbuj ponownie." };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
