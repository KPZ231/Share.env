import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { requireUser } from "@/lib/auth";
import { getTwoFactorStatus } from "@/lib/two-factor";
import { sanitizeRedirectTo } from "@/lib/redirect";
import { Verify2faForm } from "@/components/verify-2fa-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.verify2fa", path: "/verify-2fa", noindex: true });
}

export default async function Verify2faPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  await requireUser();
  const { locale } = await params;
  const { redirectTo } = await searchParams;
  const status = await getTwoFactorStatus();
  const t = await getTranslations("verify2fa");

  const safeRedirect = sanitizeRedirectTo(redirectTo, locale);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-sm flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">{t("heading")}</h1>
      <p className="mt-2 text-sm text-body">{t("subheading")}</p>

      <Verify2faForm hasTotp={status.hasTotp} hasPasskeys={status.passkeys.length > 0} redirectTo={safeRedirect} />
    </section>
  );
}
