"use client";

import { Check } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PRICE_PER_ENV_USD, formatPrice } from "@/lib/billing";

export function Pricing() {
  const t = useTranslations("pricing");
  const locale = useLocale();

  const freeFeatures = t.raw("free.features") as string[];
  const paygFeatures = t.raw("payg.features") as string[];
  const perEnvPrice = formatPrice(PRICE_PER_ENV_USD, locale);

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div data-page-hero-in className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <article
            data-page-hero-in="1"
            className="flex flex-col gap-6 rounded-[24px] border border-hairline bg-background p-8"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("free.name")}</h2>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {formatPrice(0, locale)}
                </span>
                <span className="text-sm text-foreground/60">{t("free.period")}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {t("free.description")}
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check weight="bold" className="mt-0.5 size-4 shrink-0 text-foreground/40" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-auto rounded-full border border-hairline px-6 py-3 text-center text-[16px] font-medium text-foreground transition-colors hover:bg-surface-soft"
            >
              {t("free.cta")}
            </Link>
          </article>

          <article
            data-page-hero-in="2"
            className="relative flex flex-col gap-6 rounded-[24px] border border-foreground bg-foreground p-8 text-background"
          >
            <span className="absolute -top-3 left-8 w-fit rounded-full bg-accent px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-accent-foreground">
              {t("payg.badge")}
            </span>

            <div>
              <h2 className="text-lg font-semibold">{t("payg.name")}</h2>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">{perEnvPrice}</span>
                <span className="text-sm text-background/60">{t("perEnvironment")}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-background/70">
                {t("payg.description")}
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {paygFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-background/90">
                  <Check weight="bold" className="mt-0.5 size-4 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-auto rounded-full bg-accent px-6 py-3 text-center text-[16px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              {t("payg.cta")}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
