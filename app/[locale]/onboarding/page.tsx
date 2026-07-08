import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { getUserWorkspaces } from "@/lib/dashboard";
import { isPremiumUser } from "@/lib/profile";
import { FREE_WORKSPACE_LIMIT } from "@/lib/billing";
import { ACCOUNT_TYPE_OPTIONS, COMPANY_SIZE_OPTIONS, REFERRAL_SOURCE_OPTIONS } from "@/lib/onboarding-survey";
import { OnboardingForm } from "@/components/onboarding-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.onboarding", path: "/onboarding", noindex: true });
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  const t = await getTranslations("onboarding");

  const [workspaces, premium] = await Promise.all([getUserWorkspaces(), isPremiumUser()]);

  // Already has a workspace  nothing to onboard, don't show this again.
  if (workspaces.length > 0) {
    redirect({ href: next && next.startsWith(`/${locale}`) ? next : "/dashboard", locale });
  }

  return (
    <div className="w-full max-w-md">
      <OnboardingForm
        heading={t("heading")}
        subheading={t("subheading")}
        nameLabel={t("nameLabel")}
        namePlaceholder={t("namePlaceholder")}
        submitLabel={t("submit")}
        submittingLabel={t("submitting")}
        errorRequired={t("errors.nameRequired")}
        errorSurveyRequired={t("errors.surveyRequired")}
        errorGeneric={t("errors.generic")}
        next={next ?? null}
        planNote={premium ? t("planNotePremium") : t("planNoteFree", { limit: FREE_WORKSPACE_LIMIT })}
        referralSourceLabel={t("survey.referralSourceLabel")}
        referralSourceOptions={REFERRAL_SOURCE_OPTIONS.map((value) => ({
          value,
          label: t(`survey.referralSourceOptions.${value}`),
        }))}
        accountTypeLabel={t("survey.accountTypeLabel")}
        accountTypeOptions={ACCOUNT_TYPE_OPTIONS.map((value) => ({
          value,
          label: t(`survey.accountTypeOptions.${value}`),
        }))}
        companySizeLabel={t("survey.companySizeLabel")}
        companySizeOptions={COMPANY_SIZE_OPTIONS.map((value) => ({
          value,
          label: t(`survey.companySizeOptions.${value}`),
        }))}
        selectPlaceholder={t("survey.selectPlaceholder")}
      />
    </div>
  );
}
