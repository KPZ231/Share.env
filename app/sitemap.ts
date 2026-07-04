import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ponytail: statyczna lista publicznych tras; przy dynamicznych stronach
// publicznych (np. publiczny landing per workspace) dołożyć fetch z DB.
const PUBLIC_PATHS = [""];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}/${routing.defaultLocale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])
      ),
    },
  }));
}
