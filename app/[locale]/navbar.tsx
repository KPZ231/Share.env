"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";

const NAV_LINK_HREFS = ["/workspaces", "/pricing", "/docs"] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          share-env
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINK_HREFS.map((href) => (
            <Link
              key={href}
              href={href}
              className="text-[16px] text-foreground/70 transition-colors hover:text-foreground"
            >
              {t(`links.${href.slice(1)}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-[16px] font-medium text-foreground hover:bg-surface-soft"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-foreground px-5 py-2.5 text-[16px] font-medium text-background transition-opacity hover:opacity-90"
          >
            {t("signup")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-hairline px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINK_HREFS.map((href) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-[16px] text-foreground hover:bg-surface-soft"
              >
                {t(`links.${href.slice(1)}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-3 text-center text-[16px] font-medium text-foreground hover:bg-surface-soft"
            >
              {t("login")}
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-full bg-foreground px-5 py-3 text-center text-[16px] font-medium text-background"
            >
              {t("signup")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
