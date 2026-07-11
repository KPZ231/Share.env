import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// ponytail: constant, not a param — there's only ever one publisher.
const PUBLISHER = "KPZsProductions";

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
  // Public marketing pages carry a "keywords" array in their meta.* namespace;
  // dashboard/auth namespaces don't, and noindex pages don't need one.
  let keywords: string[] | undefined;
  try {
    keywords = t.raw("keywords") as string[];
  } catch {
    keywords = undefined;
  }

  // localePrefix is "as-needed": the default locale (pl) is served unprefixed,
  // so its canonical/OG URL must omit the "/pl" segment other locales use.
  const localeUrl = (l: string) => (l === routing.defaultLocale ? path || "/" : `/${l}${path}`);

  return {
    title,
    description,
    keywords,
    authors: [{ name: PUBLISHER }],
    creator: PUBLISHER,
    publisher: PUBLISHER,
    alternates: {
      canonical: localeUrl(locale),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l)])),
        "x-default": localeUrl(routing.defaultLocale),
      },
    },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      url: localeUrl(locale),
      images: ["/hero-vault.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hero-vault.png"],
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
