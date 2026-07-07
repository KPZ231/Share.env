"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { CaretDown, SignOut, Stack, UserCircle } from "@phosphor-icons/react";
import { Link, useRouter } from "@/i18n/navigation";
import { signOutAction } from "@/lib/auth-actions";
import { setActiveWorkspaceAction } from "@/lib/auth-actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { UserWorkspace } from "@/lib/dashboard";

function WorkspaceSwitcher({ workspaces, activeId }: { workspaces: UserWorkspace[]; activeId: string }) {
  const t = useTranslations("dashboard.nav");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="group relative inline-flex max-w-[11rem] items-center">
      <Stack
        size={15}
        className="pointer-events-none absolute left-2.5 text-mute transition-colors group-focus-within:text-foreground group-hover:text-foreground"
      />
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
        className="w-full appearance-none truncate rounded-md border border-hairline-strong bg-surface-soft py-2 pl-8 pr-7 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id} className="bg-surface-elevated text-foreground">
            {w.name}
          </option>
        ))}
      </select>
      <CaretDown size={11} weight="bold" className="pointer-events-none absolute right-2.5 text-mute" />
    </div>
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
      <span className="hidden sm:block">
        <LocaleSwitcher className="w-[7.5rem]" />
      </span>
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
