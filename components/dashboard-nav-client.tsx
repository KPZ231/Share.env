"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { SignOut, UserCircle } from "@phosphor-icons/react";
import { Link, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOutAction } from "@/lib/auth-actions";
import { setActiveWorkspaceAction } from "@/lib/auth-actions";
import type { UserWorkspace } from "@/lib/dashboard";

function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => router.replace("/dashboard", { locale: e.target.value })}
      className={className}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

function WorkspaceSwitcher({ workspaces, activeId }: { workspaces: UserWorkspace[]; activeId: string }) {
  const t = useTranslations("dashboard.nav");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={t("workspaceSwitcher")}
      value={activeId}
      disabled={pending}
      onChange={(e) => {
        const workspaceId = e.target.value;
        startTransition(async () => {
          const result = await setActiveWorkspaceAction(workspaceId);
          if (result.ok) router.refresh();
        });
      }}
      className="rounded-md border border-hairline-strong bg-surface-soft px-3 py-2 text-[14px] font-medium text-foreground disabled:opacity-50"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}

export function DashboardNavClient({
  workspaces,
  activeId,
}: {
  workspaces: UserWorkspace[];
  activeId: string;
}) {
  const t = useTranslations("dashboard.nav");
  const [signingOut, setSigningOut] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />
      <LocaleSwitcher className="hidden rounded-md border border-hairline-strong bg-transparent px-3 py-2 text-[14px] text-body sm:block" />
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] font-medium text-body transition-colors hover:text-foreground"
      >
        <UserCircle size={17} />
        <span className="hidden sm:inline">{t("profile")}</span>
      </Link>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          signOutAction();
        }}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] font-medium text-body transition-colors hover:text-foreground disabled:opacity-50"
      >
        <SignOut size={17} />
        <span className="hidden sm:inline">{t("signOut")}</span>
      </button>
    </div>
  );
}
