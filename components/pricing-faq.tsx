"use client";

import { useTranslations } from "next-intl";

type FaqItem = { question: string; answer: string };

export function PricingFaq() {
  const t = useTranslations("pricingFaq");
  const items = t.raw("items") as FaqItem[];

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-16 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h2>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-[16px] border border-hairline bg-surface-soft px-6 py-4 open:pb-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-medium text-foreground marker:content-none">
                {item.question}
                <span
                  aria-hidden
                  className="shrink-0 text-2xl leading-none text-foreground/60 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-foreground/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
