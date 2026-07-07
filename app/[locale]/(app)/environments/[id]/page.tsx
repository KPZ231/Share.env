import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEnvironmentDetail } from "@/lib/environment";
import { getUserWorkspaces } from "@/lib/dashboard";
import { getGithubConnectionInfo } from "@/lib/github-connection";
import { buildMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EnvironmentEditor } from "@/components/environment-editor";
import { EnvironmentUnlockGate } from "@/components/environment-unlock-gate";
import { EnvironmentProtectionPanel } from "@/components/environment-protection-panel";
import { GithubPanel } from "@/components/github-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.environments", path: "/environments", noindex: true });
}

export default async function EnvironmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getEnvironmentDetail(id);
  if (!detail) notFound();

  const workspaces = await getUserWorkspaces();
  const role = workspaces.find((w) => w.id === detail.workspaceId)?.role ?? "viewer";
  const githubConnection = !detail.locked ? await getGithubConnectionInfo() : null;

  const t = await getTranslations("environments.list");
  const dashboardT = await getTranslations("dashboard.breadcrumbs");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: t("breadcrumb"), href: "/environments" },
          { label: detail.name },
        ]}
      />

      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
        {detail.name}
      </h1>

      {detail.locked ? (
        <EnvironmentUnlockGate envFileId={detail.id} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-8">
            <EnvironmentEditor
              id={detail.id}
              initialName={detail.name}
              initialPairs={detail.pairs}
              readOnly={role === "viewer"}
            />
            {role !== "viewer" && (
              <EnvironmentProtectionPanel
                envFileId={detail.id}
                isProtected={detail.isProtected}
                isOwner={role === "owner"}
              />
            )}
          </div>

          <GithubPanel
            mode="view"
            connected={!!githubConnection}
            githubLogin={githubConnection?.login ?? null}
            envFileId={detail.id}
            linkedRepo={detail.githubRepo}
            canManage={role !== "viewer"}
          />
        </div>
      )}
    </div>
  );
}
