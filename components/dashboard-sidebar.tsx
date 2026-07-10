"use client";

import { useTranslations } from "next-intl";
import {
  CreditCard,
  FolderSimple,
  Gear,
  SquaresFour,
  UserCircle,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { Link, usePathname } from "@/i18n/navigation";

type NavItem = { key: string; href: string; icon: Icon };

// Not `as const`: that would infer each `icon` as its own singleton function
// type instead of the shared `Icon` component type, which is what broke JSX
// (`<Icon />`) once NAV_ITEMS and BILLING_NAV_ITEM were combined into one array.
const NAV_ITEMS: NavItem[] = [
  { key: "overview", href: "/dashboard", icon: SquaresFour },
  { key: "environments", href: "/environments", icon: FolderSimple },
  { key: "members", href: "/members", icon: UsersThree },
  { key: "settings", href: "/settings", icon: Gear },
  { key: "profile", href: "/profile", icon: UserCircle },
];

const BILLING_NAV_ITEM: NavItem = { key: "billing", href: "/settings/billing", icon: CreditCard };

export function DashboardSidebar({ isOwner }: { isOwner: boolean }) {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();
  const items = isOwner ? [...NAV_ITEMS, BILLING_NAV_ITEM] : NAV_ITEMS;

  return (
    <nav
      aria-label={t("overview")}
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 rounded-full border border-hairline-strong bg-surface-soft/95 p-1.5 shadow-lg backdrop-blur">
        {items.map(({ key, href, icon: Icon }) => {
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
