"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/dashboard";
import { isPremiumUser } from "@/lib/profile";
import { FREE_WORKSPACE_LIMIT } from "@/lib/billing";
import { isAccountType, isCompanySize, isReferralSource } from "@/lib/onboarding-survey";

export type CreateWorkspaceResult = { ok: true; workspaceId: string } | { ok: false; error: string };

export type OnboardingSurveyAnswers = {
  referralSource: string;
  accountType: string;
  companySize: string | null;
};

/**
 * Creates the caller's workspace and records the one-time onboarding survey
 * answers on their profile row. Free-plan cap is enforced here as
 * defense-in-depth  the real boundary is the workspaces_insert_self RLS
 * policy (owner_id = auth.uid()), this check just stops a free user from
 * accumulating unlimited workspaces before that policy would ever object.
 */
export async function createWorkspaceAction(
  name: string,
  survey: OnboardingSurveyAnswers
): Promise<CreateWorkspaceResult> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Nazwa workspace'a musi mieć co najmniej 2 znaki." };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: "Nazwa workspace'a jest za długa." };
  }

  // Never trust the client's option ids just because the <select> only ever
  // renders known values  re-validate against the same fixed set server-side.
  if (!isReferralSource(survey.referralSource) || !isAccountType(survey.accountType)) {
    return { ok: false, error: "Nieprawidłowa odpowiedź w formularzu." };
  }
  if (survey.accountType === "company" && !survey.companySize) {
    return { ok: false, error: "Podaj wielkość firmy." };
  }
  if (survey.companySize && !isCompanySize(survey.companySize)) {
    return { ok: false, error: "Nieprawidłowa odpowiedź w formularzu." };
  }

  const [existing, premium] = await Promise.all([getUserWorkspaces(), isPremiumUser()]);
  if (!premium && existing.length >= FREE_WORKSPACE_LIMIT) {
    return { ok: false, error: "Osiągnięto limit workspace'ów w darmowym planie." };
  }

  const supabase = await createClient();

  const [{ data, error }, { error: profileError }] = await Promise.all([
    supabase.from("workspaces").insert({ name: trimmed, owner_id: user.id }).select("id").single(),
    supabase
      .from("profiles")
      .update({
        referral_source: survey.referralSource,
        account_type: survey.accountType,
        company_size: survey.accountType === "company" ? survey.companySize : null,
      })
      .eq("user_id", user.id),
  ]);

  // The survey is analytics, not the primary action  a failed profile write
  // shouldn't block workspace creation, so it's only logged, not surfaced.
  if (profileError) {
    console.error("createWorkspaceAction: failed to save onboarding survey", profileError.message);
  }

  if (error) {
    return { ok: false, error: "Nie udało się utworzyć workspace'a. Spróbuj ponownie." };
  }

  return { ok: true, workspaceId: data.id };
}
