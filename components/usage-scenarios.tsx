"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Scenario = { title: string; result: string; steps: string[] };

export function UsageScenarios() {
  const t = useTranslations("usageScenarios");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as Scenario[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-scenarios=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-scenarios=item]", {
            y: 24,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-surface-soft py-16 lg:py-24">
      <section
        aria-labelledby="scenarios-heading"
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
      >
        <div data-scenarios="header" className="max-w-2xl">
          <h2
            id="scenarios-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {items.map((item, index) => (
            <details
              key={item.title}
              data-scenarios="item"
              open={index === 0}
              className="group rounded-[20px] border border-hairline bg-background px-6 py-5 open:pb-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left marker:content-none">
                <span className="text-lg font-medium text-foreground">{item.title}</span>
                <span
                  aria-hidden
                  className="shrink-0 text-2xl leading-none text-foreground/50 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <ol className="mt-5 flex flex-col gap-3">
                {item.steps.map((step, stepIndex) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] text-accent">
                      {stepIndex + 1}
                    </span>
                    <span className="text-base leading-relaxed text-foreground/70">{step}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-5 border-t border-hairline pt-4 text-sm leading-relaxed text-foreground/60">
                {item.result}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
