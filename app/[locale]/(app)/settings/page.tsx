import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceLogoSignedUrl } from "@/lib/dashboard";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WorkspaceSettingsPanel } from "@/components/settings/workspace-settings-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.settings", path: "/settings", noindex: true });
}

export default async function SettingsPage() {
  const workspace = await resolveActiveWorkspace();
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const t = await getTranslations("settings");

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{dashboardT("dashboard")}</p>
      </div>
    );
  }

  if (workspace.role !== "owner") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: dashboardT("dashboard"), href: "/dashboard" }, { label: t("breadcrumb") }]} />
        <p className="text-body">{t("ownerOnly")}</p>
      </div>
    );
  }

  const logoUrl = await getWorkspaceLogoSignedUrl(workspace.logoPath);

  return (
    <WorkspaceSettingsPanel
      workspaceId={workspace.id}
      name={workspace.name}
      description={workspace.description}
      logoUrl={logoUrl}
    />
  );
}
