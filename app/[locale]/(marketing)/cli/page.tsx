import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import PageHero from "@/components/page-hero";
import { CliOverview } from "@/components/cli-overview";
import { CliUseCases } from "@/components/cli-use-cases";
import { CliInstall } from "@/components/cli-install";
import { CliCommands } from "@/components/cli-commands";
import { FinalCta } from "@/components/final-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.cli", path: "/cli" });
}

export default async function CliPage() {
  const t = await getTranslations("cliPage");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} tag={t("tag")} />
      <CliOverview />
      <CliUseCases />
      <CliInstall />
      <CliCommands />
      <FinalCta />
    </>
  );
}
