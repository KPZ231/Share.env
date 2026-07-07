import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceEnvFiles } from "@/lib/dashboard";
import { getWorkspaceMembers, getWorkspaceHiddenMap } from "@/lib/membership";
import { listPendingInvitations } from "@/lib/invitations";
import { requireUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MembersPanel } from "@/components/members-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.environments", path: "/members", noindex: true });
}

export default async function MembersPage() {
  const t = await getTranslations("members");
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const user = await requireUser();
  const workspace = await resolveActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{dashboardT("dashboard")}</p>
      </div>
    );
  }

  const isOwner = workspace.role === "owner";
  const [members, pendingInvites, envFiles, hiddenMap] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    isOwner ? listPendingInvitations(workspace.id) : Promise.resolve([]),
    isOwner ? getWorkspaceEnvFiles(workspace.id) : Promise.resolve([]),
    isOwner ? getWorkspaceHiddenMap(workspace.id) : Promise.resolve({}),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs items={[{ label: dashboardT("dashboard"), href: "/dashboard" }, { label: t("breadcrumb") }]} />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm text-body">{t("subheading", { count: members.length })}</p>
      </div>

      <MembersPanel
        workspaceId={workspace.id}
        currentUserId={user.id}
        isOwner={isOwner}
        members={members.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          accessKeyUpdatedAt: m.accessKeyUpdatedAt?.toISOString() ?? null,
        }))}
        envFiles={envFiles.map((f) => ({ id: f.id, name: f.name }))}
        hiddenMap={hiddenMap}
        pendingInvites={pendingInvites.map((i) => ({ ...i, expiresAt: i.expiresAt.toISOString() }))}
      />
    </div>
  );
}
