import type { MetadataRoute } from "next";

// ponytail: defaults to the real domain, not localhost — so canonical/sitemap
// URLs are correct in prod even if NEXT_PUBLIC_SITE_URL is unset there. Local
// dev overrides via .env.local.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.share-env.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/workspace",
        "/s/",
        "/api",
        "/settings",
        "/environments",
        "/members",
        "/profile",
        "/onboarding",
        "/invite",
        "/u/",
        "/cli/authorize",
        "/verify-2fa",
        "/signin",
        "/signup",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
