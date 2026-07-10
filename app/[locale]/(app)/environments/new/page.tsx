import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace } from "@/lib/dashboard";
import { checkCanAddEnvironment } from "@/lib/env-billing";
import { getGithubConnectionInfo } from "@/lib/github-connection";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EnvironmentCreator } from "@/components/environment-creator";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.newEnvironment", path: "/environments/new", noindex: true });
}

export default async function NewEnvironmentPage() {
  const t = await getTranslations("environments.new");
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const workspace = await resolveActiveWorkspace();

  const blockedMessage = !workspace
    ? dashboardT("dashboard")
    : workspace.role === "viewer"
      ? t("roleBlocked")
      : null;

  const gate = workspace ? await checkCanAddEnvironment(workspace.id) : { ok: true as const };
  const needsCheckout = !gate.ok;
  const canProceed = !blockedMessage && !needsCheckout;
  const githubConnection = canProceed ? await getGithubConnectionInfo() : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: t("breadcrumb") },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm text-body">{t("subheading")}</p>
      </div>

      {blockedMessage ? (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          {blockedMessage}
        </p>
      ) : needsCheckout ? (
        <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          <p>{t("limitReached")}</p>
          <Link href="/settings/billing" className="w-fit font-medium text-accent hover:underline">
            {t("upgradeLink")}
          </Link>
        </div>
      ) : (
        <EnvironmentCreator
          githubConnected={!!githubConnection}
          githubLogin={githubConnection?.login ?? null}
        />
      )}
    </div>
  );
}
