import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FolderSimple, Plus } from "@phosphor-icons/react/dist/ssr";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceEnvFiles } from "@/lib/dashboard";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.environments", path: "/environments", noindex: true });
}

export default async function EnvironmentsPage() {
  const t = await getTranslations("environments.list");
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const workspace = await resolveActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{dashboardT("dashboard")}</p>
      </div>
    );
  }

  const envFiles = await getWorkspaceEnvFiles(workspace.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: t("breadcrumb") },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h1>
        {workspace.role !== "viewer" && (
          <Link
            href="/environments/new"
            className="flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            {t("newEnvironment")}
          </Link>
        )}
      </div>

      {envFiles.length === 0 ? (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-soft">
          {envFiles.map((file) => (
            <li key={file.id}>
              <Link
                href={`/environments/${file.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-elevated"
              >
                <span className="flex items-center gap-2.5 truncate text-[14px] font-medium text-foreground">
                  <FolderSimple size={17} className="shrink-0 text-accent" />
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="shrink-0 text-xs text-mute">
                  {new Date(file.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
