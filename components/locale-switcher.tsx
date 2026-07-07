"use client";

import { useLocale } from "next-intl";
import { CaretDown, Globe } from "@phosphor-icons/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  pl: "Polski",
};

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={`group relative inline-flex items-center ${className}`}>
      <Globe
        size={15}
        className="pointer-events-none absolute left-2.5 text-mute transition-colors group-focus-within:text-foreground group-hover:text-foreground"
      />
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        className="w-full appearance-none rounded-md border border-hairline-strong bg-transparent py-2 pl-8 pr-7 text-[13px] font-medium text-body transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-surface-elevated text-foreground">
            {LOCALE_LABELS[l] ?? l.toUpperCase()}
          </option>
        ))}
      </select>
      <CaretDown size={11} weight="bold" className="pointer-events-none absolute right-2.5 text-mute" />
    </div>
  );
}
