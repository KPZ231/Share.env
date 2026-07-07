"use client";

import { Check, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Comparison() {
  const t = useTranslations("comparison");
  const rootRef = useRef<HTMLDivElement>(null);
  const before = t.raw("before") as string[];
  const after = t.raw("after") as string[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-comparison=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-comparison=panel]", {
            y: 24,
            opacity: 0,
            stagger: 0.1,
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
        aria-labelledby="comparison-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div data-comparison="header" className="max-w-2xl">
          <h2
            id="comparison-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div
            data-comparison="panel"
            className="flex flex-col gap-5 rounded-[24px] border border-hairline bg-background p-6 lg:p-8"
          >
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-foreground/50">
              {t("beforeLabel")}
            </p>
            <ul className="flex flex-col gap-4">
              {before.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10"
                    aria-hidden
                  >
                    <X size={13} weight="bold" className="text-foreground/50" />
                  </span>
                  <span className="text-base leading-relaxed text-foreground/60">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-comparison="panel"
            className="flex flex-col gap-5 rounded-[24px] border border-hairline bg-foreground p-6 lg:p-8"
          >
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-background/50">
              {t("afterLabel")}
            </p>
            <ul className="flex flex-col gap-4">
              {after.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/25"
                    aria-hidden
                  >
                    <Check size={13} weight="bold" className="text-accent" />
                  </span>
                  <span className="text-base leading-relaxed text-background/85">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
