import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { LegalArticle } from "@/components/legal-article";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.cookies", path: "/cookies" });
}

export default async function CookiesPage() {
  const t = await getTranslations("cookiesPage");
  const sections = t.raw("sections") as { heading: string; paragraphs?: string[]; list?: string[] }[];

  return (
    <LegalArticle
      eyebrow={t("eyebrow")}
      title={t("title")}
      updated={t("updated")}
      intro={t("intro")}
      sections={sections}
    />
  );
}
