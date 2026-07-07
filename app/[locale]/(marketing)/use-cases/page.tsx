import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import PageHero from "@/components/page-hero";
import { ValueStats } from "@/components/value-stats";
import { UseCasePersonas } from "@/components/use-case-personas";
import { UsageScenarios } from "@/components/usage-scenarios";
import { FinalCta } from "@/components/final-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.useCases", path: "/use-cases" });
}

export default async function UseCasesPage() {
  const t = await getTranslations("useCasesPage");

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        tag={t("tag")}
      />
      <ValueStats />
      <UseCasePersonas />
      <UsageScenarios />
      <FinalCta />
    </>
  );
}
