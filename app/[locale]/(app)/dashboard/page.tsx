import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  FolderSimple,
  Gear,
  LinkSimple,
  Plus,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace, getWorkspaceOverview, type WorkspaceOverview } from "@/lib/dashboard";
import { Spinner } from "@/components/spinner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Link } from "@/i18n/navigation";

// Dedupes the (cached, but still async) overview fetch across the sibling
// Suspense boundaries below so both sections share one request-scoped call.
const cachedOverview = cache((workspaceId: string): Promise<WorkspaceOverview> =>
  getWorkspaceOverview(workspaceId)
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.dashboard", path: "/dashboard", noindex: true });
}

async function EnvironmentsSection({ workspaceId }: { workspaceId: string }) {
  const t = await getTranslations("dashboard.environments");
  const overview = await cachedOverview(workspaceId);

  return (
    <section className="rounded-lg border border-hairline-strong bg-surface-soft p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-normal tracking-tight text-foreground">{t("title")}</h2>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
          {t("usage", { used: overview.environmentCount, limit: overview.freeEnvironmentLimit })}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-accent"
          style={{
            width: `${Math.min(
              100,
              (overview.environmentCount / Math.max(1, overview.freeEnvironmentLimit)) * 100
            )}%`,
          }}
        />
      </div>

      <div className="mt-6">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-mute">{t("recentTitle")}</p>

        {overview.recentEnvFiles.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-body">{t("empty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-hairline">
            {overview.recentEnvFiles.map((file) => (
              <li key={file.id}>
                <Link
                  href={`/environments/${file.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-accent"
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
    </section>
  );
}

async function StatTiles({ workspaceId }: { workspaceId: string }) {
  const t = await getTranslations("dashboard.stats");
  const overview = await cachedOverview(workspaceId);

  const tiles = [
    { label: t("environments"), value: overview.environmentCount, icon: FolderSimple },
    { label: t("members"), value: overview.memberCount, icon: UsersThree },
    { label: t("activeShareLinks"), value: overview.activeShareLinkCount, icon: LinkSimple },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tiles.map(({ label, value, icon: TileIcon }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <TileIcon size={20} />
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
            <span className="text-xs text-mute">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionFallback() {
  return (
    <div className="flex min-h-[10rem] items-center justify-center rounded-lg border border-hairline-strong bg-surface-soft">
      <Spinner />
    </div>
  );
}

async function QuickActions() {
  const t = await getTranslations("dashboard.quickActions");

  const actions = [
    { key: "newEnvironment", label: t("newEnvironment"), icon: Plus, href: "/environments/new" },
    { key: "inviteMember", label: t("inviteMember"), icon: UserPlus, href: null },
    { key: "createShareLink", label: t("createShareLink"), icon: LinkSimple, href: null },
    { key: "manageWorkspace", label: t("manageWorkspace"), icon: Gear, href: null },
  ];

  return (
    <section>
      <h2 className="font-display text-xl font-normal tracking-tight text-foreground">{t("title")}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ key, label, icon: ActionIcon, href }) =>
          href ? (
            <Link
              key={key}
              href={href}
              className="group relative flex flex-col items-start gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5 text-left transition-colors hover:border-foreground"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
                <ActionIcon size={18} />
              </span>
              <span className="text-[14px] font-medium text-foreground">{label}</span>
            </Link>
          ) : (
            <button
              key={key}
              type="button"
              disabled
              aria-disabled
              className="group relative flex flex-col items-start gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5 text-left opacity-60 [cursor:not-allowed]"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
                <ActionIcon size={18} />
              </span>
              <span className="text-[14px] font-medium text-foreground">{label}</span>
              <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                {t("comingSoon")}
              </span>
            </button>
          )
        )}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const workspace = await resolveActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-[80%] max-w-none px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{t("environments.empty")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs items={[{ label: t("breadcrumbs.dashboard") }]} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
            {workspace.name}
          </h1>
          <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            {t(`roles.${workspace.role}`)}
          </span>
        </div>
      </div>

      <Suspense fallback={<SectionFallback />}>
        <EnvironmentsSection workspaceId={workspace.id} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <StatTiles workspaceId={workspace.id} />
      </Suspense>

      <QuickActions />
    </div>
  );
}
