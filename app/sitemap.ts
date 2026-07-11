import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

// ponytail: defaults to the real domain, not localhost — so canonical/sitemap
// URLs are correct in prod even if NEXT_PUBLIC_SITE_URL is unset there. Local
// dev overrides via .env.local.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.share-env.site";

// ponytail: statyczna lista publicznych tras; przy dynamicznych stronach
// publicznych (np. publiczny landing per workspace) dołożyć fetch z DB.
const PUBLIC_PATHS = [
  "",
  "/features",
  "/pricing",
  "/use-cases",
  "/cli",
  "/security",
  "/privacy",
  "/terms",
  "/cookies",
];

// localePrefix is "as-needed": the default locale (pl) is served unprefixed.
function localeUrl(locale: string, path: string) {
  return locale === routing.defaultLocale ? `${siteUrl}${path}` : `${siteUrl}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: localeUrl(routing.defaultLocale, path),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, localeUrl(l, path)])
      ),
    },
  }));
}
