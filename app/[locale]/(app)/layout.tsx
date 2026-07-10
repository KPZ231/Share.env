import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getUserWorkspaces, resolveActiveWorkspace } from "@/lib/dashboard";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  const [workspaces, active] = await Promise.all([getUserWorkspaces(), resolveActiveWorkspace()]);

  if (!active) {
    const locale = await getLocale();
    redirect({ href: "/onboarding", locale });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <DashboardNav workspaces={workspaces} activeWorkspaceId={active?.id ?? ""} />
      <main className="flex-1 pb-28">{children}</main>
      <DashboardSidebar isOwner={active?.role === "owner"} />
    </div>
  );
}
