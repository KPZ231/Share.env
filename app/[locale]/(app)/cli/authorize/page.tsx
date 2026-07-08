import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { requireUser } from "@/lib/auth";
import { CliAuthorizeForm } from "@/components/cli-authorize-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.dashboard", path: "/cli/authorize", noindex: true });
}

export default async function CliAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireUser();
  const { code } = await searchParams;
  const t = await getTranslations("cli");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">{t("heading")}</h1>
        {code ? (
          <p className="mt-2 text-[14px] text-body">{t("subheading", { code })}</p>
        ) : (
          <p className="mt-2 text-[14px] text-body">{t("missingCode")}</p>
        )}
      </div>
      {code && (
        <CliAuthorizeForm
          userCode={code}
          approveLabel={t("approve")}
          denyLabel={t("deny")}
          approvedMessage={t("approved")}
          deniedMessage={t("denied")}
        />
      )}
    </div>
  );
}
