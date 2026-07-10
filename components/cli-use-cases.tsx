"use client";

import { ArrowsClockwise, UserPlus, ArrowClockwise, type Icon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type UseCase = { title: string; description: string; payoff: string };

const ICONS: Icon[] = [UserPlus, ArrowsClockwise, ArrowClockwise];

export function CliUseCases() {
  const t = useTranslations("cliPage.useCases");
  const tRaw = useTranslations("cliPage");
  const rootRef = useRef<HTMLDivElement>(null);
  const cases = tRaw.raw("useCaseItems") as UseCase[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-cli-usecases=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-cli-usecases=card]", {
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
      <section aria-labelledby="cli-usecases-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-cli-usecases="header" className="max-w-2xl">
          <h2 id="cli-usecases-heading" className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cases.map((item, index) => {
            const CaseIcon = ICONS[index];

            return (
              <article
                key={item.title}
                data-cli-usecases="card"
                className="flex flex-col gap-5 rounded-[24px] border border-hairline bg-background p-6 lg:p-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent/15" aria-hidden>
                  <CaseIcon size={24} weight="bold" className="text-accent" />
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-base leading-relaxed text-foreground/70">{item.description}</p>
                </div>

                <p className="mt-auto border-t border-hairline pt-4 text-sm leading-relaxed text-foreground/60">
                  {item.payoff}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
