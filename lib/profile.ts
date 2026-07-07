import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type Profile = {
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
  marketingConsent: boolean;
  productEmailsConsent: boolean;
  interestedIntegrations: string[];
};

const EMPTY_PROFILE_DEFAULTS = {
  displayName: null,
  bio: null,
  avatarPath: null,
  marketingConsent: false,
  productEmailsConsent: true,
  interestedIntegrations: [] as string[],
};

/**
 * Loads the signed-in user's profile row, creating an empty one on first
 * visit. RLS-scoped (profiles_insert_self / profiles_select_self)  a user
 * can only ever touch their own row. Wrapped in `cache()` so page + layout
 * reads in one request dedupe to a single round trip.
 */
export const getOrCreateProfile = cache(async (): Promise<Profile> => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, bio, avatar_path, marketing_consent, product_emails_consent, interested_integrations"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    return {
      userId: existing.user_id,
      displayName: existing.display_name,
      bio: existing.bio,
      avatarPath: existing.avatar_path,
      marketingConsent: existing.marketing_consent,
      productEmailsConsent: existing.product_emails_consent,
      interestedIntegrations: existing.interested_integrations ?? [],
    };
  }

  const { error: insertError } = await supabase.from("profiles").insert({ user_id: user.id });
  if (insertError) throw insertError;

  return { userId: user.id, ...EMPTY_PROFILE_DEFAULTS };
});

/**
 * Whether the signed-in user has the manual premium flag set (see
 * profiles.is_premium  no billing flow yet, see prisma/schema.prisma).
 * RLS-scoped read; the column itself is write-locked against the
 * "authenticated" role by a DB trigger so this can't be self-granted.
 */
export async function isPremiumUser(): Promise<boolean> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.is_premium ?? false;
}

export type PublicProfile = { userId: string; displayName: string | null; bio: string | null; avatarPath: string | null };

/**
 * Another user's profile, scoped entirely by RLS (profiles_select_self OR
 * profiles_select_workspace_members)  no application-level membership check
 * needed here, the query itself returns null for anyone outside a shared
 * workspace instead of erroring, so this can't be used to enumerate whether
 * a user id exists at all.
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, bio, avatar_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { userId: data.user_id, displayName: data.display_name, bio: data.bio, avatarPath: data.avatar_path };
}

/**
 * Private bucket ("avatars")  the stored path is never a usable URL on its
 * own, so every render that needs to display an avatar goes through a
 * short-lived signed URL instead of a public one.
 */
export async function getAvatarSignedUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(avatarPath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
