"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { List, SignOut, SquaresFour, UserCircle, X } from "@phosphor-icons/react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOutAction } from "@/lib/auth-actions";

const NAV_LINK_HREFS = ["/features", "/use-cases", "/pricing", "/docs"] as const;

type Account = { email: string; name: string | null };

function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
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

function getInitials({ email, name }: Account): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function AccountMenu({ account }: { account: Account }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const initials = getInitials(account);
  const displayName = account.name ?? account.email;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={t("account")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong bg-surface-soft text-[13px] font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {initials}
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={t("account")}
        className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-lg border border-hairline-strong bg-surface-elevated p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="truncate border-b border-hairline px-3 py-2.5 text-[13px] text-mute">{displayName}</div>
        <Link
          href="/dashboard"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          <SquaresFour size={17} />
          {t("dashboard")}
        </Link>
        <Link
          href="/profile"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          <UserCircle size={17} />
          {t("profile")}
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            signOutAction();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          <SignOut size={17} />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}

export function NavbarClient({ account }: { account: Account | null }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo/4.png" alt="Share.env" width={140} height={32} priority className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINK_HREFS.map((href) => (
            <Link
              key={href}
              href={href}
              className="text-[14px] font-medium text-body transition-colors hover:text-foreground"
            >
              {t(`links.${href.slice(1)}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher className="rounded-md border border-hairline-strong bg-transparent px-3 py-2 text-[14px] text-body" />
          {account ? (
            <AccountMenu account={account} />
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-md px-3 py-2 text-[14px] font-medium text-body hover:text-foreground"
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-4 py-2 text-[14px] font-medium text-black transition-opacity hover:opacity-90"
              >
                {t("signup")}
              </Link>
            </>
          )}
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
                className="rounded-md px-3 py-3 text-[15px] text-body hover:bg-surface-soft hover:text-foreground"
              >
                {t(`links.${href.slice(1)}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
            <LocaleSwitcher className="rounded-md border border-hairline-strong bg-transparent px-3 py-3 text-center text-[15px] text-body" />
            {account ? (
              <>
                <div className="truncate rounded-md px-3 py-2 text-center text-[13px] text-mute">
                  {account.name ?? account.email}
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md px-3 py-3 text-center text-[15px] font-medium text-body hover:bg-surface-soft"
                >
                  <SquaresFour size={18} />
                  {t("dashboard")}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md px-3 py-3 text-center text-[15px] font-medium text-body hover:bg-surface-soft"
                >
                  <UserCircle size={18} />
                  {t("profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOutAction();
                  }}
                  className="flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-center text-[15px] font-medium text-background"
                >
                  <SignOut size={18} />
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-center text-[15px] font-medium text-body hover:bg-surface-soft"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-foreground px-5 py-3 text-center text-[15px] font-medium text-black"
                >
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
