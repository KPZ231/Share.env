import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceEnvFiles } from "@/lib/dashboard";
import { listIntegrationConnections } from "@/lib/integration-connection";
import { getGithubConnectionInfo } from "@/lib/github-connection";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { IntegrationsDocs } from "@/components/settings/integrations-docs";
import { IntegrationsWipNotice } from "@/components/settings/integrations-wip-notice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.settings", path: "/settings/integrations", noindex: true });
}

export default async function IntegrationsSettingsPage() {
  const workspace = await resolveActiveWorkspace();
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const settingsT = await getTranslations("settings");
  const t = await getTranslations("settingsIntegrations");

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{dashboardT("dashboard")}</p>
      </div>
    );
  }

  const [connections, envFiles, githubInfo] = await Promise.all([
    listIntegrationConnections(workspace.id),
    getWorkspaceEnvFiles(workspace.id),
    getGithubConnectionInfo(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <IntegrationsWipNotice />
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: settingsT("breadcrumb"), href: "/settings" },
          { label: t("breadcrumb") },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-body">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <IntegrationsPanel
          workspaceId={workspace.id}
          isOwner={workspace.role === "owner"}
          connections={connections}
          envFiles={envFiles.map((f) => ({
            id: f.id,
            name: f.name,
            syncTargets: (f.syncTargets as Record<string, { id: string; name: string }> | null) ?? {},
          }))}
          githubConnected={githubInfo !== null}
          githubLogin={githubInfo?.login ?? null}
        />
        <IntegrationsDocs />
      </div>
    </div>
  );
}
