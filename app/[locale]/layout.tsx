import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { Analytics } from "@vercel/analytics/next"
import "../globals.css";

const GTM_ID = "GTM-NLCRJ39J";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displaySerif = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  // ponytail: defaults to the real domain, not localhost — so metadataBase
  // (and every relative canonical/OG URL resolved against it) is correct in
  // prod even if NEXT_PUBLIC_SITE_URL is unset there. Local dev overrides via .env.local.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.share-env.site"),
  title: { template: "%s  share-env", default: "share-env" },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // ponytail: defaults to the real domain, not localhost — same rationale as
  // the module-level metadataBase above.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.share-env.site";
  const publisherRef = { "@type": "Organization", name: "KPZsProductions" };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "share.env",
    url: siteUrl,
    description:
      "Secure .env file and secrets sharing for teams: AES-256-GCM encryption, role-based access, and expiring share links.",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    author: publisherRef,
    publisher: publisherRef,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free for up to 3 environments. $2 per environment per month after that.",
    },
  };
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "share.env",
    url: siteUrl,
    parentOrganization: publisherRef,
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <NextIntlClientProvider>
          <Analytics />
          {children}
          <Toaster position="top-right" richColors closeButton />
          <CookieConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
