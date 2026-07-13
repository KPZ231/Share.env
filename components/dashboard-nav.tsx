import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { UserWorkspace } from "@/lib/dashboard";
import { DashboardNavClient } from "@/components/dashboard-nav-client";

export async function DashboardNav({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: UserWorkspace[];
  activeWorkspaceId: string;
}) {
  const t = await getTranslations("dashboard.nav");

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo/4.png" alt="Share.env" width={1672} height={941} priority className="h-10 w-auto" />
          <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-mute md:inline">
            {t("overview")}
          </span>
        </Link>

        <DashboardNavClient workspaces={workspaces} activeId={activeWorkspaceId} />
      </div>
    </header>
  );
}
