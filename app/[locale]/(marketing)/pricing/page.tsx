import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import PageHero from "@/components/page-hero";
import { Pricing } from "@/components/pricing";
import { PricingCalculator } from "@/components/pricing-calculator";
import { Comparison } from "@/components/comparison";
import { SecurityDeepDive } from "@/components/security-deep-dive";
import { Integrations } from "@/components/integrations";
import { PricingFaq } from "@/components/pricing-faq";
import { FinalCta } from "@/components/final-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.pricing", path: "/pricing" });
}

export default async function PricingPage() {
  const t = await getTranslations("meta.pricing");

  return (
    <>
      <PageHero title={t("title")} description={t("description")} />
      <Pricing />
      <PricingCalculator />
      <Comparison />
      <SecurityDeepDive />
      <Integrations />
      <PricingFaq />
      <FinalCta />
    </>
  );
}
