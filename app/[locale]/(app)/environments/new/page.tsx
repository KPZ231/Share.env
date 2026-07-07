import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceOverview } from "@/lib/dashboard";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";
import { getGithubConnectionInfo } from "@/lib/github-connection";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EnvironmentCreator } from "@/components/environment-creator";

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

  const overview = workspace ? await getWorkspaceOverview(workspace.id) : null;
  const atLimit = overview ? overview.environmentCount >= FREE_ENVIRONMENT_LIMIT : false;
  const canProceed = !blockedMessage && !atLimit;
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
      ) : atLimit ? (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          {t("limitReached")}
        </p>
      ) : (
        <EnvironmentCreator
          githubConnected={!!githubConnection}
          githubLogin={githubConnection?.login ?? null}
        />
      )}
    </div>
  );
}
