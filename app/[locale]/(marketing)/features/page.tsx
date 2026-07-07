import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import PageHero from "@/components/page-hero";
import { Features } from "@/components/features";
import { SecurityDeepDive } from "@/components/security-deep-dive";
import { Comparison } from "@/components/comparison";
import { Integrations } from "@/components/integrations";
import { FinalCta } from "@/components/final-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.features", path: "/features" });
}

export default async function FeaturesPage() {
  const t = await getTranslations("featuresPage");

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        tag={t("tag")}
      />
      <Features />
      <SecurityDeepDive />
      <Comparison />
      <Integrations />
      <FinalCta />
    </>
  );
}