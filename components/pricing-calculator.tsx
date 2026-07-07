"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FREE_ENVIRONMENT_LIMIT, formatPrice, monthlyCost } from "@/lib/billing";

const MIN_ENVIRONMENTS = 1;
const MAX_ENVIRONMENTS = 15;
const DEFAULT_ENVIRONMENTS = 6;

export function PricingCalculator() {
  const t = useTranslations("pricingCalculator");
  const locale = useLocale();
  const sliderId = useId();
  const [environments, setEnvironments] = useState(DEFAULT_ENVIRONMENTS);

  const paidEnvironments = Math.max(0, environments - FREE_ENVIRONMENT_LIMIT);
  const total = formatPrice(monthlyCost(environments), locale);

  return (
    <section className="bg-surface-soft py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 rounded-[24px] border border-hairline bg-background p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:p-12">
          <div className="flex flex-col gap-6">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {t("heading")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-foreground/70">
                {t("subheading")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor={sliderId}
                className="flex items-baseline justify-between text-sm font-medium text-foreground"
              >
                <span>{t("label")}</span>
                <span className="text-foreground/60">
                  {t("environmentCount", { count: environments })}
                </span>
              </label>
              <input
                id={sliderId}
                type="range"
                min={MIN_ENVIRONMENTS}
                max={MAX_ENVIRONMENTS}
                value={environments}
                onChange={(e) => setEnvironments(Number(e.target.value))}
                className="h-2 w-full cursor-pointer rounded-full accent-accent"
              />

              <div className="flex flex-wrap gap-1.5" aria-hidden>
                {Array.from({ length: environments }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      index < FREE_ENVIRONMENT_LIMIT ? "bg-foreground/20" : "bg-accent"
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-foreground/60">
                {paidEnvironments > 0
                  ? t("breakdown", { free: FREE_ENVIRONMENT_LIMIT, paid: paidEnvironments })
                  : t("breakdownFree")}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 border-t border-hairline pt-6 lg:items-end lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-foreground/60">
              {t("totalLabel")}
            </span>
            <span className="text-5xl font-semibold tracking-tight text-foreground">{total}</span>
            <span className="text-sm text-foreground/60">{t("perMonth")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
