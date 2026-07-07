"use client";

import { useTranslations } from "next-intl";
import {
  FolderSimple,
  Gear,
  LinkSimple,
  SquaresFour,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { Link, usePathname } from "@/i18n/navigation";

const NAV_ITEMS = [
  { key: "overview", href: "/dashboard", icon: SquaresFour },
  { key: "environments", href: "/environments", icon: FolderSimple },
  { key: "members", href: null, icon: UsersThree },
  { key: "shareLinks", href: null, icon: LinkSimple },
  { key: "settings", href: null, icon: Gear },
  { key: "profile", href: "/profile", icon: UserCircle },
] as const;

export function DashboardSidebar() {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("overview")}
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 rounded-full border border-hairline-strong bg-surface-soft/95 p-1.5 shadow-lg backdrop-blur">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active = href !== null && pathname === href;
          const label = t(key);

          if (!href) {
            return (
              <span
                key={key}
                aria-disabled
                title={t("comingSoon")}
                className="flex size-10 items-center justify-center rounded-full text-mute opacity-40 [cursor:not-allowed] sm:size-auto sm:gap-2 sm:px-4 sm:py-2"
              >
                <Icon size={18} />
                <span className="hidden text-[13px] font-medium sm:inline">{label}</span>
              </span>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`flex size-10 items-center justify-center gap-2 rounded-full text-[13px] font-medium transition-colors sm:size-auto sm:px-4 sm:py-2 ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-body hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
