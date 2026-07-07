import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveInvite } from "@/lib/invitations";
import { AcceptInviteForm } from "@/components/accept-invite-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.dashboard", path: "/invite", noindex: true });
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("invitations");
  const roleT = await getTranslations("dashboard.roles");

  const invite = await resolveInvite(token);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      {invite ? (
        <>
          <div>
            <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">{t("heading")}</h1>
            <p className="mt-2 text-[14px] text-body">
              {t("subheading", { workspace: invite.workspaceName, role: roleT(invite.role) })}
            </p>
          </div>
          <AcceptInviteForm token={token} acceptLabel={t("accept")} />
        </>
      ) : (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-[14px] text-body">
          {t("invalid")}
        </p>
      )}
    </div>
  );
}
