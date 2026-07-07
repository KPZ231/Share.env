"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Bell, BellRinging } from "@phosphor-icons/react";
import { INTEGRATIONS_CATALOG } from "@/lib/integrations";
import { toggleIntegrationInterestAction } from "@/app/[locale]/(app)/profile/actions";

export function IntegrationsSearch({ initialInterested }: { initialInterested: string[] }) {
  const t = useTranslations("profile.integrations");
  const [query, setQuery] = useState("");
  const [interested, setInterested] = useState(new Set(initialInterested));
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INTEGRATIONS_CATALOG;
    return INTEGRATIONS_CATALOG.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [query]);

  function toggle(slug: string) {
    setPending(slug);
    setInterested((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    startTransition(async () => {
      await toggleIntegrationInterestAction(slug);
      setPending(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-md border border-hairline bg-background py-2.5 pl-9 pr-3.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
        />
      </div>

      {results.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline-strong px-4 py-6 text-center text-[13px] text-mute">
          {t("empty", { query })}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {results.map((integration) => {
            const isInterested = interested.has(integration.slug);
            const isBusy = isPending && pending === integration.slug;
            return (
              <li key={integration.slug} className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-foreground">{integration.name}</span>
                  <span className="text-[13px] text-mute">{integration.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(integration.slug)}
                  disabled={Boolean(isBusy)}
                  aria-pressed={isInterested}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors active:scale-95 disabled:opacity-60 ${
                    isInterested
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline-strong text-body hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {isInterested ? <BellRinging size={14} weight="fill" /> : <Bell size={14} />}
                  {isInterested ? t("notifying") : t("notify")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[12px] text-mute">{t("disclaimer")}</p>
    </div>
  );
}
