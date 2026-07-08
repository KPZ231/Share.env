import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveShareLink } from "@/lib/share-links";
import { TakeoverForm } from "@/components/takeover-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.dashboard", path: "/s", noindex: true });
}

export default async function ShareLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("shareLinks.takeover");

  const link = await resolveShareLink(token);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      {link ? (
        <>
          <div>
            <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">{t("heading")}</h1>
            <p className="mt-2 text-[14px] text-body">
              {t("subheading", { env: link.envFileName, workspace: link.workspaceName })}
            </p>
            <p className="mt-2 text-[13px] text-mute">{t("protectionHint")}</p>
          </div>
          <TakeoverForm token={token} acceptLabel={t("accept")} />
        </>
      ) : (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-[14px] text-body">
          {t("invalid")}
        </p>
      )}
    </div>
  );
}
