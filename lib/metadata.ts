import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function buildMetadata({
  locale,
  namespace,
  path = "",
  noindex = false,
}: {
  locale: string;
  namespace: string;
  path?: string;
  noindex?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}${path}`])
      ),
    },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      url: `/${locale}${path}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
