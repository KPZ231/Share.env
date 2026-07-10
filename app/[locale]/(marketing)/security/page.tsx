import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import PageHero from "@/components/page-hero";
import { SecurityDeepDive } from "@/components/security-deep-dive";
import { LegalSections, type LegalSection } from "@/components/legal-article";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.security", path: "/security" });
}

export default async function SecurityPage() {
  const t = await getTranslations("securityPage");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} tag={t("tag")} />
      <SecurityDeepDive />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <LegalSections sections={sections} />
      </section>
    </>
  );
}
